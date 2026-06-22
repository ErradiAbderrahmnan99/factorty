<?php

namespace App\Http\Controllers;

use App\Models\RetourAchat;
use App\Models\TauxTva;
use App\Models\RetourAchatLine;
use App\Models\RetourAchatLineLot;
use App\Models\Reception;
use App\Models\ReceptionLine;
use App\Models\Tier;
use App\Models\Product;
use App\Models\Devise;
use App\Models\Unit;
use App\Models\Entrepot;
use App\Models\Branche;
use App\Services\StockService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Exception;

class RetourAchatController extends Controller
{
    public function index(Request $request): Response
    {
        $query = RetourAchat::with(['tier', 'devise'])
            ->orderBy('created_at', 'desc');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('ref', 'like', "%{$search}%")
                  ->orWhereHas('tier', function ($tQ) use ($search) {
                      $tQ->where('label', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $retours = $query->paginate(10)->withQueryString();

        return Inertia::render('RetourAchat/Index', [
            'retours' => $retours,
            'filters' => $request->only('search', 'status'),
            'tauxTvas'  => TauxTva::where('actif', true)->orderBy('taux')->get(),
        ]);
    }

    public function create(): Response
    {
        $tiers = Tier::where('type', 'fournisseur')
            ->where('status', 'actif')
            ->orderBy('label')
            ->get();

        $products = Product::where('status', 'actif')
            ->with(['purchaseUnit', 'stockUnit'])
            ->orderBy('label')
            ->get();

        $devises = Devise::orderBy('label')->get();
        $units = Unit::orderBy('label')->get();
        $entrepots = Entrepot::orderBy('label')->get();
        $modesReglement = DB::table('modes_reglement')->select('id', 'label')->orderBy('label')->get();
        $conditionsReglement = DB::table('conditions_reglement')->select('id', 'label')->orderBy('label')->get();
        $comptesBancaires = DB::table('comptes_bancaires')->select('id', 'label', 'rib as code')->orderBy('label')->get();

        // Get validated Receptions with computed remaining quantities
        $receptions = Reception::where('status', 'valide')
            ->with(['tier', 'devise', 'lines.product.stockUnit', 'lines.purchaseUnit', 'lines.lots'])
            ->orderBy('ref', 'desc')
            ->get()
            ->map(function ($reception) {
                $reception->lines = $reception->lines->map(function ($line) {
                    $returnedQty = RetourAchatLine::where('reception_line_id', $line->id)
                        ->whereHas('retourAchat', function ($q) {
                            $q->where('status', '!=', 'annule');
                        })
                        ->sum('qty');
                    $line->returned_qty = (float) $returnedQty;
                    $line->remaining_qty = max(0.0, (float) $line->qty - (float) $returnedQty);
                    return $line;
                });
                return $reception;
            });

        return Inertia::render('RetourAchat/Create', [
            'tiers'               => $tiers,
            'products'            => $products,
            'devises'             => $devises,
            'units'               => $units,
            'entrepots'           => $entrepots,
            'receptions'          => $receptions,
            'modesReglement'      => $modesReglement,
            'conditionsReglement' => $conditionsReglement,
            'comptesBancaires'    => $comptesBancaires,
            'branches'            => Branche::orderBy('name')->get(),
            'tauxTvas'  => TauxTva::where('actif', true)->orderBy('taux')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'tier_id'                    => ['required', 'exists:tiers,id'],
            'date_retour'                => ['required', 'date'],
            'devise_id'                  => ['required', 'exists:devises,id'],
            'branche_id'                 => ['required', 'exists:branches,id'],
            'mode_reglement_id'          => ['nullable', 'exists:modes_reglement,id'],
            'condition_reglement_id'     => ['nullable', 'exists:conditions_reglement,id'],
            'compte_bancaire_id'         => ['nullable', 'exists:comptes_bancaires,id'],
            'note_public'                => ['nullable', 'string'],
            'note_private'               => ['nullable', 'string'],
            'lines'                      => ['required', 'array', 'min:1'],
            'lines.*.reception_line_id'  => ['required', 'exists:reception_lines,id'],
            'lines.*.product_id'         => ['required', 'exists:products,id'],
            'lines.*.entrepot_id'        => ['required', 'exists:entrepots,id'],
            'lines.*.purchase_unit_id'   => ['nullable', 'exists:units,id'],
            'lines.*.taux_tva_id'    => ['required', 'exists:taux_tvas,id'],
            'lines.*.qty'                => ['required', 'numeric', 'min:0.0001'],
            'lines.*.pu_ht'              => ['required', 'numeric', 'min:0'],
            'lines.*.pu_ttc'             => ['required', 'numeric', 'min:0'],
            'lines.*.remise'             => ['nullable', 'numeric', 'min:0', 'max:100'],
            'lines.*.rm'                 => ['nullable', 'numeric', 'min:0'],
        ]);

        try {
            DB::transaction(function () use ($request) {
                // Generate Reference: RTA-YYYYMM-XXXX
                $date = date('Ym', strtotime($request->input('date_retour')));
                $count = RetourAchat::whereYear('date_retour', date('Y', strtotime($request->input('date_retour'))))
                    ->whereMonth('date_retour', date('m', strtotime($request->input('date_retour'))))
                    ->count();

                $nextNum = str_pad($count + 1, 4, '0', STR_PAD_LEFT);
                $ref = "RTA-{$date}-{$nextNum}";

                $totalHt = 0;
                $totalTtc = 0;
                $linesData = [];

                foreach ($request->input('lines') as $line) {
                    $receptionLine = ReceptionLine::findOrFail($line['reception_line_id']);

                    // Security check: remaining quantity in DB
                    $alreadyReturned = RetourAchatLine::where('reception_line_id', $line['reception_line_id'])
                        ->whereHas('retourAchat', function ($q) {
                            $q->where('status', '!=', 'annule');
                        })
                        ->sum('qty');
                    $remaining = max(0.0, (float) $receptionLine->qty - (float) $alreadyReturned);

                    if ((double)$line['qty'] > $remaining + 0.0001) {
                        throw new Exception("La quantité retournée ({$line['qty']}) dépasse la quantité restante reçue ({$remaining}) pour le produit.");
                    }

                    $qty = (double)$line['qty'];
                    $puHt = (double)$line['pu_ht'];
                    $tauxTvaId = $line['taux_tva_id'] ?? null;
            $taux = $tauxTvas[$tauxTvaId]->taux ?? 0;
            $tva    = (double)$taux;
                    $remise = (double)($line['remise'] ?? 0);
                    $rm = (double)($line['rm'] ?? 0);

                    $lineHt = $qty * $puHt;
                    $discount = ($lineHt * $remise / 100) + $rm;
                    $lineTotalHt = max(0, $lineHt - $discount);
                    $lineTotalTtc = $lineTotalHt * (1 + $tva / 100);

                    $totalHt += $lineTotalHt;
                    $totalTtc += $lineTotalTtc;

                    // Handle lots
                    $lotsData = [];
                    if (isset($line['lots']) && !empty($line['lots'])) {
                        foreach ($line['lots'] as $lotInput) {
                            $lotsData[] = [
                                'lot_number'       => $lotInput['lot_number'],
                                'quantity'         => (double)$lotInput['quantity'],
                                'fabrication_date' => $lotInput['fabrication_date'] ?? null,
                                'expiration_date'  => $lotInput['expiration_date'] ?? null,
                            ];
                        }
                    } else {
                        $originalLots = $receptionLine ? $receptionLine->lots : collect();
                        if ($originalLots->isNotEmpty()) {
                            $remainingToAllocate = $qty;
                            foreach ($originalLots as $oLot) {
                                if ($remainingToAllocate <= 0) break;
                                $allocatedQty = min($remainingToAllocate, (double)$oLot->quantity);
                                if ($allocatedQty > 0) {
                                    $lotsData[] = [
                                        'lot_number'       => $oLot->lot_number,
                                        'quantity'         => $allocatedQty,
                                        'fabrication_date' => $oLot->fabrication_date,
                                        'expiration_date'  => $oLot->expiration_date,
                                    ];
                                    $remainingToAllocate -= $allocatedQty;
                                }
                            }
                            if ($remainingToAllocate > 0 && count($lotsData) > 0) {
                                $lotsData[0]['quantity'] += $remainingToAllocate;
                            } elseif ($remainingToAllocate > 0) {
                                $lotsData[] = [
                                    'lot_number' => $originalLots[0]->lot_number,
                                    'quantity' => $remainingToAllocate,
                                    'fabrication_date' => $originalLots[0]->fabrication_date,
                                    'expiration_date' => $originalLots[0]->expiration_date,
                                ];
                            }
                        }
                    }

                    $linesData[] = [
                        'reception_line_id' => $line['reception_line_id'],
                        'product_id'        => $line['product_id'],
                        'entrepot_id'       => $line['entrepot_id'],
                        'purchase_unit_id'  => $line['purchase_unit_id'] ?? null,
                        'taux_tva_id'  => $tauxTvaId,
                        'qty'               => $qty,
                        'pu_ht'             => $puHt,
                        'pu_ttc'            => $line['pu_ttc'],
                        'remise'            => $remise,
                        'rm'                => $rm,
                        'total_ht'          => $lineTotalHt,
                        'total_ttc'         => $lineTotalTtc,
                        'lots'              => $lotsData,
                    ];
                }

                $totalTva = max(0, $totalTtc - $totalHt);

                $retour = RetourAchat::create([
                    'ref'                    => $ref,
                    'tier_id'                => $request->input('tier_id'),
                    'date_retour'            => $request->input('date_retour'),
                    'devise_id'              => $request->input('devise_id'),
                    'branche_id'             => $request->input('branche_id'),
                    'mode_reglement_id'      => $request->input('mode_reglement_id'),
                    'condition_reglement_id' => $request->input('condition_reglement_id'),
                    'compte_bancaire_id'     => $request->input('compte_bancaire_id'),
                    'note_public'            => $request->input('note_public'),
                    'note_private'           => $request->input('note_private'),
                    'status'                 => 'brouillon',
                    'total_ht'               => $totalHt,
                    'total_tva'              => $totalTva,
                    'total_ttc'              => $totalTtc,
                ]);

                foreach ($linesData as $lData) {
                    $lots = $lData['lots'];
                    unset($lData['lots']);

                    $rLine = $retour->lines()->create($lData);

                    foreach ($lots as $lot) {
                        $rLine->lots()->create([
                            'lot_number'       => $lot['lot_number'],
                            'quantity'         => $lot['quantity'],
                            'fabrication_date' => $lot['fabrication_date'] ?? null,
                            'expiration_date'  => $lot['expiration_date'] ?? null,
                        ]);
                    }
                }
            });
        } catch (Exception $e) {
            return back()->with('error', $e->getMessage());
        }

        return redirect()->route('retours-achat.index')->with('success', 'Retour d\'achat créé avec succès.');
    }

    public function edit(RetourAchat $retourAchat): Response
    {
        $retourAchat->load(['lines.tauxTva', 'lines.product', 'lines.purchaseUnit', 'lines.lots', 'lines.receptionLine.reception']);

        $tiers = Tier::where('type', 'fournisseur')
            ->where('status', 'actif')
            ->orderBy('label')
            ->get();

        $devises = Devise::orderBy('label')->get();
        $entrepots = Entrepot::orderBy('label')->get();
        $modesReglement = DB::table('modes_reglement')->select('id', 'label')->orderBy('label')->get();
        $conditionsReglement = DB::table('conditions_reglement')->select('id', 'label')->orderBy('label')->get();
        $comptesBancaires = DB::table('comptes_bancaires')->select('id', 'label', 'rib as code')->orderBy('label')->get();

        $retourLines = $retourAchat->lines->map(function ($line) {
            if ($line->receptionLine) {
                $otherReturned = RetourAchatLine::where('reception_line_id', $line->reception_line_id)
                    ->where('id', '!=', $line->id)
                    ->whereHas('retourAchat', function ($q) {
                        $q->where('status', '!=', 'annule');
                    })
                    ->sum('qty');
                $remaining_qty = max(0.0, (float) $line->receptionLine->qty - (float) $otherReturned);
                $original_bl_qty = (float) $line->receptionLine->qty;
                $bl_ref = $line->receptionLine->reception ? $line->receptionLine->reception->ref : 'N/A';
            } else {
                $remaining_qty = $line->qty;
                $original_bl_qty = $line->qty;
                $bl_ref = 'N/A';
            }

            return [
                'id' => $line->id,
                'reception_line_id' => $line->reception_line_id,
                'product_id' => $line->product_id,
                'entrepot_id' => $line->entrepot_id,
                'purchase_unit_id' => $line->purchase_unit_id,
                'qty' => (float)$line->qty,
                'pu_ht' => (float)$line->pu_ht,
                'pu_ttc' => (float)$line->pu_ttc,
                'remise' => (float)$line->remise,
                'rm' => (float)$line->rm,
                'total_ht' => (float)$line->total_ht,
                'total_ttc' => (float)$line->total_ttc,
                'remaining_qty' => $remaining_qty,
                'original_bl_qty' => $original_bl_qty,
                'bl_ref' => $bl_ref,
                'product' => $line->product ? [
                    'id' => $line->product->id,
                    'ref' => $line->product->ref,
                    'label' => $line->product->label,
                    'manage_by_lot' => (bool)$line->product->manage_by_lot,
                ] : null,
                'purchase_unit' => $line->purchaseUnit ? [
                    'id' => $line->purchaseUnit->id,
                    'code' => $line->purchaseUnit->code,
                ] : null,
                'lots' => $line->lots->map(function ($lot) {
                    return [
                        'lot_number' => $lot->lot_number,
                        'quantity' => (float)$lot->quantity,
                        'fabrication_date' => $lot->fabrication_date,
                        'expiration_date' => $lot->expiration_date,
                    ];
                })->toArray(),
            ];
        });

        $retourData = $retourAchat->toArray();
        $retourData['lines'] = $retourLines->toArray();

        return Inertia::render('RetourAchat/Edit', [
            'retour'              => $retourData,
            'tiers'               => $tiers,
            'devises'             => $devises,
            'entrepots'           => $entrepots,
            'modesReglement'      => $modesReglement,
            'conditionsReglement' => $conditionsReglement,
            'comptesBancaires'    => $comptesBancaires,
            'branches'            => Branche::orderBy('name')->get(),
            'tauxTvas'  => TauxTva::where('actif', true)->orderBy('taux')->get(),
        ]);
    }

    public function update(Request $request, RetourAchat $retourAchat): RedirectResponse
    {
        if ($retourAchat->status === 'valide') {
            return back()->with('error', 'Un retour validé ne peut pas être modifié.');
        }

        $request->validate([
            'tier_id'                    => ['required', 'exists:tiers,id'],
            'date_retour'                => ['required', 'date'],
            'devise_id'                  => ['required', 'exists:devises,id'],
            'branche_id'                 => ['required', 'exists:branches,id'],
            'mode_reglement_id'          => ['nullable', 'exists:modes_reglement,id'],
            'condition_reglement_id'     => ['nullable', 'exists:conditions_reglement,id'],
            'compte_bancaire_id'         => ['nullable', 'exists:comptes_bancaires,id'],
            'note_public'                => ['nullable', 'string'],
            'note_private'               => ['nullable', 'string'],
            'lines'                      => ['required', 'array', 'min:1'],
            'lines.*.id'                 => ['required', 'exists:retour_achat_lines,id'],
            'lines.*.qty'                => ['required', 'numeric', 'min:0.0001'],
        ]);

        try {
            DB::transaction(function () use ($request, $retourAchat) {
                $totalHt = 0;
                $totalTtc = 0;
                $linesUpdates = [];

                foreach ($request->input('lines') as $lineInput) {
                    $rLine = RetourAchatLine::findOrFail($lineInput['id']);
                    $receptionLine = $rLine->receptionLine;

                    $otherReturned = RetourAchatLine::where('reception_line_id', $rLine->reception_line_id)
                        ->where('id', '!=', $rLine->id)
                        ->whereHas('retourAchat', function ($q) {
                            $q->where('status', '!=', 'annule');
                        })
                        ->sum('qty');
                    $remaining = max(0.0, (float) ($receptionLine ? $receptionLine->qty : $rLine->qty) - (float) $otherReturned);

                    if ((double)$lineInput['qty'] > $remaining + 0.0001) {
                        throw new Exception("La quantité retournée ({$lineInput['qty']}) dépasse la quantité restante reçue ({$remaining}) pour le produit.");
                    }

                    $qty = (double)$lineInput['qty'];
                    $puHt = (double)$rLine->pu_ht;
                    $tva = (double)$rLine->tva;
                    $remise = (double)$rLine->remise;
                    $rm = (double)$rLine->rm;

                    $lineHt = $qty * $puHt;
                    $discount = ($lineHt * $remise / 100) + $rm;
                    $lineTotalHt = max(0, $lineHt - $discount);
                    $lineTotalTtc = $lineTotalHt * (1 + $tva / 100);

                    $totalHt += $lineTotalHt;
                    $totalTtc += $lineTotalTtc;

                    $linesUpdates[] = [
                        'line' => $rLine,
                        'qty' => $qty,
                        'total_ht' => $lineTotalHt,
                        'total_ttc' => $lineTotalTtc,
                        'lots' => $lineInput['lots'] ?? null,
                    ];
                }

                $totalTva = max(0, $totalTtc - $totalHt);

                $retourAchat->update([
                    'tier_id'                => $request->input('tier_id'),
                    'date_retour'            => $request->input('date_retour'),
                    'devise_id'              => $request->input('devise_id'),
                    'branche_id'             => $request->input('branche_id'),
                    'mode_reglement_id'      => $request->input('mode_reglement_id'),
                    'condition_reglement_id' => $request->input('condition_reglement_id'),
                    'compte_bancaire_id'     => $request->input('compte_bancaire_id'),
                    'note_public'            => $request->input('note_public'),
                    'note_private'           => $request->input('note_private'),
                    'total_ht'               => $totalHt,
                    'total_tva'              => $totalTva,
                    'total_ttc'              => $totalTtc,
                ]);

                foreach ($linesUpdates as $up) {
                    $line = $up['line'];
                    $oldQty = $line->qty;
                    $newQty = $up['qty'];

                    $line->update([
                        'qty' => $newQty,
                        'total_ht' => $up['total_ht'],
                        'total_ttc' => $up['total_ttc'],
                    ]);

                    if (isset($up['lots']) && is_array($up['lots'])) {
                        $line->lots()->delete();
                        foreach ($up['lots'] as $lotInput) {
                            $line->lots()->create([
                                'lot_number'       => $lotInput['lot_number'],
                                'quantity'         => (double)$lotInput['quantity'],
                                'fabrication_date' => $lotInput['fabrication_date'] ?? null,
                                'expiration_date'  => $lotInput['expiration_date'] ?? null,
                            ]);
                        }
                    } else {
                        $lots = $line->lots;
                        if ($lots->isNotEmpty() && $oldQty > 0) {
                            $ratio = $newQty / $oldQty;
                            foreach ($lots as $lot) {
                                $lot->update([
                                    'quantity' => (double)$lot->quantity * $ratio,
                                ]);
                            }
                        }
                    }
                }
            });
        } catch (Exception $e) {
            return back()->with('error', $e->getMessage());
        }

        return redirect()->route('retours-achat.index')->with('success', 'Retour d\'achat mis à jour avec succès.');
    }

    public function destroy(RetourAchat $retourAchat): RedirectResponse
    {
        if ($retourAchat->status === 'valide') {
            return back()->with('error', 'Un retour d\'achat validé ne peut pas être supprimé.');
        }

        $retourAchat->delete();

        return redirect()->route('retours-achat.index')->with('success', 'Retour d\'achat supprimé avec succès.');
    }

    public function updateStatus(Request $request, RetourAchat $retourAchat): RedirectResponse
    {
        if ($retourAchat->status === 'valide') {
            return back()->with('error', 'Un retour d\'achat validé ne peut plus changer de statut.');
        }

        if ($retourAchat->status === 'annule') {
            return back()->with('error', 'Un retour d\'achat annulé ne peut plus changer de statut.');
        }

        $request->validate([
            'status' => ['required', 'string', 'in:brouillon,valide,annule'],
        ]);

        $newStatus = $request->input('status');

        if ($newStatus === 'valide') {
            $stockService = new StockService();
            $result = $stockService->validateAndDeductStockForRetourAchat($retourAchat);

            if (!$result['status']) {
                return back()->with('error', $result['message']);
            }
        } else {
            $retourAchat->update([
                'status' => $newStatus,
            ]);
        }

        return back()->with('success', 'Statut du retour d\'achat mis à jour.');
    }
}
