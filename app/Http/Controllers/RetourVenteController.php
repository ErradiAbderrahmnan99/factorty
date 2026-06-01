<?php

namespace App\Http\Controllers;

use App\Models\RetourVente;
use App\Models\RetourVenteLine;
use App\Models\RetourVenteLineLot;
use App\Models\Livraison;
use App\Models\LivraisonLine;
use App\Models\Tier;
use App\Models\Product;
use App\Models\Devise;
use App\Models\Unit;
use App\Models\Employee;
use App\Models\Entrepot;
use App\Services\StockService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Exception;

class RetourVenteController extends Controller
{
    public function index(Request $request): Response
    {
        $query = RetourVente::with(['tier', 'devise'])
            ->orderBy('created_at', 'desc');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('ref', 'like', "%{$search}%")
                  ->orWhere('commercial', 'like', "%{$search}%")
                  ->orWhereHas('tier', function ($tQ) use ($search) {
                      $tQ->where('label', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $retours = $query->paginate(10)->withQueryString();

        return Inertia::render('RetourVente/Index', [
            'retours' => $retours,
            'filters' => $request->only('search', 'status'),
        ]);
    }

    public function create(): Response
    {
        $tiers = Tier::where('type', 'client')
            ->where('status', 'actif')
            ->orderBy('label')
            ->get();

        $products = Product::where('status', 'actif')
            ->with(['saleUnit', 'stockUnit'])
            ->orderBy('label')
            ->get();

        $devises = Devise::orderBy('label')->get();
        $units = Unit::orderBy('label')->get();
        $entrepots = Entrepot::orderBy('label')->get();
        
        $commercials = Employee::whereIn('type', ['commercial', 'agent'])
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();

        // Get validated BLs with computed remaining quantities
        $livraisons = Livraison::where('status', 'valide')
            ->with(['tier', 'devise', 'lines.product.stockUnit', 'lines.saleUnit', 'lines.lots'])
            ->orderBy('ref', 'desc')
            ->get()
            ->map(function ($bl) {
                $bl->lines = $bl->lines->map(function ($line) {
                    $returnedQty = RetourVenteLine::where('livraison_line_id', $line->id)
                        ->whereHas('retourVente', function ($q) {
                            $q->where('status', '!=', 'annule');
                        })
                        ->sum('qty');
                    $line->returned_qty = (float) $returnedQty;
                    $line->remaining_qty = max(0.0, (float) $line->qty - (float) $returnedQty);
                    return $line;
                });
                // Filter out lines that have no remaining quantity left to return
                $bl->lines = $bl->lines->values();
                return $bl;
            });

        return Inertia::render('RetourVente/Create', [
            'tiers'        => $tiers,
            'products'     => $products,
            'devises'      => $devises,
            'units'        => $units,
            'entrepots'    => $entrepots,
            'commercials'  => $commercials,
            'livraisons'   => $livraisons,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'tier_id'             => ['required', 'exists:tiers,id'],
            'commercial'          => ['nullable', 'string', 'max:255'],
            'date_retour'         => ['required', 'date'],
            'devise_id'           => ['required', 'exists:devises,id'],
            'lines'               => ['required', 'array', 'min:1'],
            'lines.*.livraison_line_id' => ['required', 'exists:livraison_lines,id'],
            'lines.*.product_id'  => ['required', 'exists:products,id'],
            'lines.*.entrepot_id' => ['required', 'exists:entrepots,id'],
            'lines.*.sale_unit_id'=> ['nullable', 'exists:units,id'],
            'lines.*.tva'         => ['required', 'numeric', 'min:0'],
            'lines.*.qty'         => ['required', 'numeric', 'min:0.0001'],
            'lines.*.pu_ht'       => ['required', 'numeric', 'min:0'],
            'lines.*.pu_ttc'      => ['required', 'numeric', 'min:0'],
            'lines.*.remise'      => ['nullable', 'numeric', 'min:0', 'max:100'],
            'lines.*.rm'          => ['nullable', 'numeric', 'min:0'],
        ]);

        try {
            DB::transaction(function () use ($request) {
                // Generate Reference: RT-YYYYMM-XXXX
                $date = date('Ym', strtotime($request->input('date_retour')));
                $count = RetourVente::whereYear('date_retour', date('Y', strtotime($request->input('date_retour'))))
                    ->whereMonth('date_retour', date('m', strtotime($request->input('date_retour'))))
                    ->count();
                
                $nextNum = str_pad($count + 1, 4, '0', STR_PAD_LEFT);
                $ref = "RT-{$date}-{$nextNum}";

                $totalHt = 0;
                $totalTtc = 0;
                $linesData = [];

                foreach ($request->input('lines') as $line) {
                    $livraisonLine = LivraisonLine::findOrFail($line['livraison_line_id']);
                    
                    // Security check: remaining quantity in DB
                    $alreadyReturned = RetourVenteLine::where('livraison_line_id', $line['livraison_line_id'])
                        ->whereHas('retourVente', function ($q) {
                            $q->where('status', '!=', 'annule');
                        })
                        ->sum('qty');
                    $remaining = max(0.0, (float) $livraisonLine->qty - (float) $alreadyReturned);

                    if ((double)$line['qty'] > $remaining + 0.0001) {
                        throw new Exception("La quantité retournée ({$line['qty']}) dépasse la quantité restante livrée ({$remaining}) pour le produit.");
                    }

                    $qty = (double)$line['qty'];
                    $puHt = (double)$line['pu_ht'];
                    $tva = (double)$line['tva'];
                    $remise = (double)($line['remise'] ?? 0);
                    $rm = (double)($line['rm'] ?? 0);

                    $lineHt = $qty * $puHt;
                    $discount = ($lineHt * $remise / 100) + $rm;
                    $lineTotalHt = max(0, $lineHt - $discount);
                    $lineTotalTtc = $lineTotalHt * (1 + $tva / 100);

                    $totalHt += $lineTotalHt;
                    $totalTtc += $lineTotalTtc;

                    // Automatically determine lots from original BL line
                    $originalLots = $livraisonLine->lots;
                    $lotsData = [];

                    if ($originalLots->isNotEmpty()) {
                        // Proportionately allocate returned quantity to original lots
                        // For simplicity, we assign the return to the first original lot or partition it
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
                        // If anything remains (due to rounding or user edits), assign to the first lot
                        if ($remainingToAllocate > 0 && count($lotsData) > 0) {
                            $lotsData[0]['quantity'] += $remainingToAllocate;
                        } elseif ($remainingToAllocate > 0) {
                            // Fallback
                            $lotsData[] = [
                                'lot_number' => $originalLots[0]->lot_number,
                                'quantity' => $remainingToAllocate,
                                'fabrication_date' => $originalLots[0]->fabrication_date,
                                'expiration_date' => $originalLots[0]->expiration_date,
                            ];
                        }
                    }

                    $linesData[] = [
                        'livraison_line_id' => $line['livraison_line_id'],
                        'product_id'        => $line['product_id'],
                        'entrepot_id'       => $line['entrepot_id'],
                        'sale_unit_id'      => $line['sale_unit_id'] ?? null,
                        'tva'               => $tva,
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

                $retour = RetourVente::create([
                    'ref'          => $ref,
                    'tier_id'      => $request->input('tier_id'),
                    'commercial'   => $request->input('commercial'),
                    'date_retour'  => $request->input('date_retour'),
                    'devise_id'    => $request->input('devise_id'),
                    'status'       => 'brouillon',
                    'total_ht'     => $totalHt,
                    'total_tva'    => $totalTva,
                    'total_ttc'    => $totalTtc,
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

        return redirect()->route('retours-vente.index')->with('success', 'Retour de vente créé avec succès.');
    }

    public function edit(RetourVente $retourVente): Response
    {
        $retourVente->load(['lines.product', 'lines.saleUnit', 'lines.lots', 'lines.livraisonLine.livraison']);

        $tiers = Tier::where('type', 'client')
            ->where('status', 'actif')
            ->orderBy('label')
            ->get();

        $devises = Devise::orderBy('label')->get();
        $entrepots = Entrepot::orderBy('label')->get();
        
        $commercials = Employee::whereIn('type', ['commercial', 'agent'])
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();

        // In edit mode, we calculate remaining qty in the system for these lines
        $retourVente->lines = $retourVente->lines->map(function ($line) use ($retourVente) {
            if ($line->livraisonLine) {
                // Already returned by other retours
                $otherReturned = RetourVenteLine::where('livraison_line_id', $line->livraison_line_id)
                    ->where('id', '!=', $line->id)
                    ->whereHas('retourVente', function ($q) {
                        $q->where('status', '!=', 'annule');
                    })
                    ->sum('qty');
                $line->remaining_qty = max(0.0, (float) $line->livraisonLine->qty - (float) $otherReturned);
                $line->original_bl_qty = (float) $line->livraisonLine->qty;
                $line->bl_ref = $line->livraisonLine->livraison->ref;
            } else {
                $line->remaining_qty = $line->qty;
                $line->original_bl_qty = $line->qty;
                $line->bl_ref = 'N/A';
            }
            return $line;
        });

        return Inertia::render('RetourVente/Edit', [
            'retour'      => $retourVente,
            'tiers'       => $tiers,
            'devises'     => $devises,
            'entrepots'   => $entrepots,
            'commercials' => $commercials,
        ]);
    }

    public function update(Request $request, RetourVente $retourVente): RedirectResponse
    {
        if ($retourVente->status === 'valide') {
            return back()->with('error', 'Un retour validé ne peut pas être modifié.');
        }

        $request->validate([
            'tier_id'             => ['required', 'exists:tiers,id'],
            'commercial'          => ['nullable', 'string', 'max:255'],
            'date_retour'         => ['required', 'date'],
            'devise_id'           => ['required', 'exists:devises,id'],
            'lines'               => ['required', 'array', 'min:1'],
            'lines.*.id'          => ['required', 'exists:retour_vente_lines,id'],
            'lines.*.qty'         => ['required', 'numeric', 'min:0.0001'],
        ]);

        try {
            DB::transaction(function () use ($request, $retourVente) {
                $totalHt = 0;
                $totalTtc = 0;
                $linesUpdates = [];

                foreach ($request->input('lines') as $lineInput) {
                    $rLine = RetourVenteLine::findOrFail($lineInput['id']);
                    $livraisonLine = $rLine->livraisonLine;

                    // Remaining check
                    $otherReturned = RetourVenteLine::where('livraison_line_id', $rLine->livraison_line_id)
                        ->where('id', '!=', $rLine->id)
                        ->whereHas('retourVente', function ($q) {
                            $q->where('status', '!=', 'annule');
                        })
                        ->sum('qty');
                    $remaining = max(0.0, (float) ($livraisonLine ? $livraisonLine->qty : $rLine->qty) - (float) $otherReturned);

                    if ((double)$lineInput['qty'] > $remaining + 0.0001) {
                        throw new Exception("La quantité retournée ({$lineInput['qty']}) dépasse la quantité restante livrée ({$remaining}) pour le produit.");
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
                    ];
                }

                $totalTva = max(0, $totalTtc - $totalHt);

                $retourVente->update([
                    'tier_id'      => $request->input('tier_id'),
                    'commercial'   => $request->input('commercial'),
                    'date_retour'  => $request->input('date_retour'),
                    'devise_id'    => $request->input('devise_id'),
                    'total_ht'     => $totalHt,
                    'total_tva'    => $totalTva,
                    'total_ttc'    => $totalTtc,
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

                    // Adjust lots proportionately or scale them
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
            });
        } catch (Exception $e) {
            return back()->with('error', $e->getMessage());
        }

        return redirect()->route('retours-vente.index')->with('success', 'Retour de vente mis à jour avec succès.');
    }

    public function destroy(RetourVente $retourVente): RedirectResponse
    {
        if ($retourVente->status === 'valide') {
            return back()->with('error', 'Un retour de vente validé ne peut pas être supprimé.');
        }

        $retourVente->delete();

        return redirect()->route('retours-vente.index')->with('success', 'Retour de vente supprimé avec succès.');
    }

    public function updateStatus(Request $request, RetourVente $retourVente): RedirectResponse
    {
        $request->validate([
            'status' => ['required', 'string', 'in:brouillon,valide,annule'],
        ]);

        $newStatus = $request->input('status');

        if ($newStatus === 'valide') {
            $stockService = new StockService();
            $result = $stockService->validateAndAddStockForRetourVente($retourVente);

            if (!$result['status']) {
                return back()->with('error', $result['message']);
            }
        } else {
            $retourVente->update([
                'status' => $newStatus,
            ]);
        }

        return back()->with('success', 'Statut du retour de vente mis à jour.');
    }
}
