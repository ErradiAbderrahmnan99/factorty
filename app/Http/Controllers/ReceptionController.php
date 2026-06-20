<?php

namespace App\Http\Controllers;

use App\Models\Reception;
use App\Models\TauxTva;
use App\Models\ReceptionLine;
use App\Models\ReceptionLineLot;
use App\Models\Tier;
use App\Models\Product;
use App\Models\Devise;
use App\Models\Unit;
use App\Models\ModeReglement;
use App\Models\ConditionReglement;
use App\Models\CompteBancaire;
use App\Models\Entrepot;
use App\Models\Branche;
use App\Services\StockService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ReceptionController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Reception::with(['tier', 'devise', 'modeReglement', 'conditionReglement', 'compteBancaire', 'commandeAchat', 'factures'])
            ->orderBy('created_at', 'desc');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('ref', 'like', "%{$search}%")
                  ->orWhereHas('tier', fn($tQ) => $tQ->where('label', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        return Inertia::render('Reception/Index', [
            'receptions' => $query->paginate(10)->withQueryString(),
            'filters'    => $request->only('search', 'status'),
            'tauxTvas'  => TauxTva::where('actif', true)->orderBy('taux')->get(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Reception/Create', [
            'tiers'               => Tier::where('type', 'fournisseur')->where('status', 'actif')->orderBy('label')->get(),
            'products'            => Product::where('status', 'actif')->with(['purchaseUnit', 'stockUnit'])->orderBy('label')->get(),
            'devises'             => Devise::orderBy('label')->get(),
            'units'               => Unit::orderBy('label')->get(),
            'modesReglement'      => ModeReglement::orderBy('label')->get(),
            'conditionsReglement' => ConditionReglement::orderBy('label')->get(),
            'comptesBancaires'    => CompteBancaire::orderBy('label')->get(),
            'entrepots'           => Entrepot::orderBy('label')->get(),
            'branches'            => Branche::orderBy('name')->get(),
            'tauxTvas'  => TauxTva::where('actif', true)->orderBy('taux')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'tier_id'                => ['required', 'exists:tiers,id'],
            'date_reception'         => ['required', 'date'],
            'devise_id'              => ['required', 'exists:devises,id'],
            'branche_id'             => ['required', 'exists:branches,id'],
            'mode_reglement_id'      => ['nullable', 'exists:modes_reglement,id'],
            'condition_reglement_id' => ['nullable', 'exists:conditions_reglement,id'],
            'compte_bancaire_id'     => ['nullable', 'exists:comptes_bancaires,id'],
            'note_public'            => ['nullable', 'string'],
            'note_private'           => ['nullable', 'string'],
            'commande_achat_id'      => ['nullable', 'exists:commandes_achat,id'],
            'lines'                  => ['required', 'array', 'min:1'],
            'lines.*.product_id'     => ['required', 'exists:products,id'],
            'lines.*.entrepot_id'    => ['required', 'exists:entrepots,id'],
            'lines.*.purchase_unit_id' => ['nullable', 'exists:units,id'],
            'lines.*.taux_tva_id'    => ['required', 'exists:taux_tvas,id'],
            'lines.*.qty'            => ['required', 'numeric', 'min:0.0001'],
            'lines.*.pu_ht'          => ['required', 'numeric', 'min:0'],
            'lines.*.pu_ttc'         => ['required', 'numeric', 'min:0'],
            'lines.*.remise'         => ['nullable', 'numeric', 'min:0', 'max:100'],
            'lines.*.rm'             => ['nullable', 'numeric', 'min:0'],
            'lines.*.commande_achat_line_id' => ['nullable', 'exists:commande_achat_lines,id'],
            'lines.*.lots'           => ['nullable', 'array'],
            'lines.*.lots.*.lot_number' => ['required_with:lines.*.lots', 'string'],
            'lines.*.lots.*.quantity' => ['required_with:lines.*.lots', 'numeric', 'min:0.0001'],
            'lines.*.lots.*.fabrication_date' => ['nullable', 'date'],
            'lines.*.lots.*.expiration_date' => ['nullable', 'date'],
        ]);

        $reception = DB::transaction(function () use ($request) {
            // Generate Reference automatically: BR-YYYYMM-XXXX
            $date  = date('Ym', strtotime($request->input('date_reception')));
            $count = Reception::whereYear('date_reception', date('Y', strtotime($request->input('date_reception'))))
                ->whereMonth('date_reception', date('m', strtotime($request->input('date_reception'))))->count();
            $ref = 'BR-' . $date . '-' . str_pad($count + 1, 4, '0', STR_PAD_LEFT);

            [$totalHt, $totalTtc, $linesData] = $this->calcLines($request->input('lines'));

            $reception = Reception::create([
                'ref'                    => $ref,
                'tier_id'                => $request->input('tier_id'),
                'date_reception'         => $request->input('date_reception'),
                'devise_id'              => $request->input('devise_id'),
                'branche_id'             => $request->input('branche_id'),
                'mode_reglement_id'      => $request->input('mode_reglement_id'),
                'condition_reglement_id' => $request->input('condition_reglement_id'),
                'compte_bancaire_id'     => $request->input('compte_bancaire_id'),
                'note_public'            => $request->input('note_public'),
                'note_private'           => $request->input('note_private'),
                'status'                 => 'brouillon',
                'total_ht'               => $totalHt,
                'total_tva'              => max(0, $totalTtc - $totalHt),
                'total_ttc'              => $totalTtc,
                'commande_achat_id'      => $request->input('commande_achat_id'),
            ]);

            foreach ($linesData as $lData) {
                $createdLine = $reception->lines()->create([
                    'product_id'       => $lData['product_id'],
                    'entrepot_id'      => $lData['entrepot_id'],
                    'purchase_unit_id' => $lData['purchase_unit_id'],
                    'tva'              => $lData['tva'],
                    'qty'              => $lData['qty'],
                    'pu_ht'            => $lData['pu_ht'],
                    'pu_ttc'           => $lData['pu_ttc'],
                    'remise'           => $lData['remise'],
                    'rm'               => $lData['rm'],
                    'total_ht'         => $lData['total_ht'],
                    'total_ttc'        => $lData['total_ttc'],
                    'commande_achat_line_id' => $lData['commande_achat_line_id'],
                ]);

                if (!empty($lData['lots'])) {
                    foreach ($lData['lots'] as $lot) {
                        $createdLine->lots()->create([
                            'lot_number'       => $lot['lot_number'],
                            'quantity'         => $lot['quantity'],
                            'fabrication_date' => $lot['fabrication_date'] ?? null,
                            'expiration_date'  => $lot['expiration_date'] ?? null,
                        ]);
                    }
                }
            }

            return $reception;
        });

        if ($reception->commande_achat_id) {
            $reception->commandeAchat->recalculateOrderStatus();
        }

        return redirect()->route('receptions.index')->with('success', 'Bon de réception créé avec succès.');
    }

    public function edit(Reception $reception): Response
    {
        $reception->load(['lines.product', 'lines.purchaseUnit', 'lines.entrepot', 'lines.lots']);

        return Inertia::render('Reception/Edit', [
            'reception'           => $reception,
            'tiers'               => Tier::where('type', 'fournisseur')->where('status', 'actif')->orderBy('label')->get(),
            'products'            => Product::where('status', 'actif')->with(['purchaseUnit', 'stockUnit'])->orderBy('label')->get(),
            'devises'             => Devise::orderBy('label')->get(),
            'units'               => Unit::orderBy('label')->get(),
            'modesReglement'      => ModeReglement::orderBy('label')->get(),
            'conditionsReglement' => ConditionReglement::orderBy('label')->get(),
            'comptesBancaires'    => CompteBancaire::orderBy('label')->get(),
            'entrepots'           => Entrepot::orderBy('label')->get(),
            'branches'            => Branche::orderBy('name')->get(),
            'tauxTvas'  => TauxTva::where('actif', true)->orderBy('taux')->get(),
        ]);
    }

    public function update(Request $request, Reception $reception): RedirectResponse
    {
        if ($reception->status === 'valide') {
            return back()->with('error', 'Un bon de réception validé ne peut pas être modifié.');
        }

        $request->validate([
            'tier_id'                => ['required', 'exists:tiers,id'],
            'date_reception'         => ['required', 'date'],
            'devise_id'              => ['required', 'exists:devises,id'],
            'branche_id'             => ['required', 'exists:branches,id'],
            'mode_reglement_id'      => ['nullable', 'exists:modes_reglement,id'],
            'condition_reglement_id' => ['nullable', 'exists:conditions_reglement,id'],
            'compte_bancaire_id'     => ['nullable', 'exists:comptes_bancaires,id'],
            'note_public'            => ['nullable', 'string'],
            'note_private'           => ['nullable', 'string'],
            'commande_achat_id'      => ['nullable', 'exists:commandes_achat,id'],
            'lines'                  => ['required', 'array', 'min:1'],
            'lines.*.product_id'     => ['required', 'exists:products,id'],
            'lines.*.entrepot_id'    => ['required', 'exists:entrepots,id'],
            'lines.*.purchase_unit_id' => ['nullable', 'exists:units,id'],
            'lines.*.taux_tva_id'    => ['required', 'exists:taux_tvas,id'],
            'lines.*.qty'            => ['required', 'numeric', 'min:0.0001'],
            'lines.*.pu_ht'          => ['required', 'numeric', 'min:0'],
            'lines.*.pu_ttc'         => ['required', 'numeric', 'min:0'],
            'lines.*.remise'         => ['nullable', 'numeric', 'min:0', 'max:100'],
            'lines.*.rm'             => ['nullable', 'numeric', 'min:0'],
            'lines.*.commande_achat_line_id' => ['nullable', 'exists:commande_achat_lines,id'],
            'lines.*.lots'           => ['nullable', 'array'],
            'lines.*.lots.*.lot_number' => ['required_with:lines.*.lots', 'string'],
            'lines.*.lots.*.quantity' => ['required_with:lines.*.lots', 'numeric', 'min:0.0001'],
            'lines.*.lots.*.fabrication_date' => ['nullable', 'date'],
            'lines.*.lots.*.expiration_date' => ['nullable', 'date'],
        ]);

        $oldCommandeAchatId = $reception->commande_achat_id;

        DB::transaction(function () use ($request, $reception) {
            [$totalHt, $totalTtc, $linesData] = $this->calcLines($request->input('lines'));

            $reception->update([
                'tier_id'                => $request->input('tier_id'),
                'date_reception'         => $request->input('date_reception'),
                'devise_id'              => $request->input('devise_id'),
                'branche_id'             => $request->input('branche_id'),
                'mode_reglement_id'      => $request->input('mode_reglement_id'),
                'condition_reglement_id' => $request->input('condition_reglement_id'),
                'compte_bancaire_id'     => $request->input('compte_bancaire_id'),
                'note_public'            => $request->input('note_public'),
                'note_private'           => $request->input('note_private'),
                'total_ht'               => $totalHt,
                'total_tva'              => max(0, $totalTtc - $totalHt),
                'total_ttc'              => $totalTtc,
                'commande_achat_id'      => $request->input('commande_achat_id'),
            ]);

            // Recreate Lines
            $reception->lines()->delete();

            foreach ($linesData as $lData) {
                $createdLine = $reception->lines()->create([
                    'product_id'       => $lData['product_id'],
                    'entrepot_id'      => $lData['entrepot_id'],
                    'purchase_unit_id' => $lData['purchase_unit_id'],
                    'tva'              => $lData['tva'],
                    'qty'              => $lData['qty'],
                    'pu_ht'            => $lData['pu_ht'],
                    'pu_ttc'           => $lData['pu_ttc'],
                    'remise'           => $lData['remise'],
                    'rm'               => $lData['rm'],
                    'total_ht'         => $lData['total_ht'],
                    'total_ttc'        => $lData['total_ttc'],
                    'commande_achat_line_id' => $lData['commande_achat_line_id'],
                ]);

                if (!empty($lData['lots'])) {
                    foreach ($lData['lots'] as $lot) {
                        $createdLine->lots()->create([
                            'lot_number'       => $lot['lot_number'],
                            'quantity'         => $lot['quantity'],
                            'fabrication_date' => $lot['fabrication_date'] ?? null,
                            'expiration_date'  => $lot['expiration_date'] ?? null,
                        ]);
                    }
                }
            }
        });

        if ($oldCommandeAchatId) {
            $oldCmd = \App\Models\CommandeAchat::find($oldCommandeAchatId);
            if ($oldCmd) { $oldCmd->recalculateOrderStatus(); }
        }
        if ($reception->commande_achat_id && $reception->commande_achat_id != $oldCommandeAchatId) {
            $reception->commandeAchat->recalculateOrderStatus();
        }

        return redirect()->route('receptions.index')->with('success', 'Bon de réception mis à jour avec succès.');
    }

    public function destroy(Reception $reception): RedirectResponse
    {
        if ($reception->status === 'valide') {
            return back()->with('error', 'Un bon de réception validé ne peut pas être supprimé.');
        }

        $commandeAchat = $reception->commandeAchat;
        $reception->delete();

        if ($commandeAchat) {
            $commandeAchat->recalculateOrderStatus();
        }

        return redirect()->route('receptions.index')->with('success', 'Bon de réception supprimé avec succès.');
    }

    public function updateStatus(Request $request, Reception $reception): RedirectResponse
    {
        if ($reception->status === 'valide') {
            return back()->with('error', 'Un bon de réception déjà validé ne peut plus être modifié.');
        }

        if ($reception->status === 'annulee') {
            return back()->with('error', 'Un bon de réception déjà annulé ne peut plus être modifié.');
        }

        $request->validate([
            'status' => ['required', 'string', 'in:brouillon,valide,annulee'],
        ]);

        $newStatus = $request->input('status');

        if ($newStatus === 'valide') {
            $stockService = new StockService();
            $result = $stockService->validateAndAddStockForReception($reception);

            if (!$result['status']) {
                return back()->with('error', $result['message']);
            }
        } else {
            $reception->update(['status' => $newStatus]);
        }

        if ($reception->commande_achat_id) {
            $reception->commandeAchat->recalculateOrderStatus();
        }

        return back()->with('success', 'Statut du bon de réception mis à jour.');
    }

    private function calcLines(array $lines): array
    {
        $totalHt = 0;
        $totalTtc = 0;
        $linesData = [];

        // Pre-load all needed TauxTva records
        $tauxTvaIds = array_unique(array_filter(array_column($lines, 'taux_tva_id')));
        $tauxTvas = TauxTva::whereIn('id', $tauxTvaIds)->get()->keyBy('id');

        foreach ($lines as $line) {
            $qty    = (double)$line['qty'];
            $puHt   = (double)$line['pu_ht'];
            $tauxTvaId = $line['taux_tva_id'] ?? null;
            $taux = $tauxTvas[$tauxTvaId]->taux ?? 0;
            $tva    = (double)$taux;
            $remise = (double)($line['remise'] ?? 0);
            $rm     = (double)($line['rm'] ?? 0);

            $lineHt      = $qty * $puHt;
            $discount    = ($lineHt * $remise / 100) + $rm;
            $lineTotalHt = max(0, $lineHt - $discount);
            $lineTotalTtc = $lineTotalHt * (1 + $tva / 100);

            $totalHt  += $lineTotalHt;
            $totalTtc += $lineTotalTtc;

            $linesData[] = [
                'product_id'       => $line['product_id'],
                'entrepot_id'      => $line['entrepot_id'],
                'purchase_unit_id' => $line['purchase_unit_id'] ?? null,
                'taux_tva_id'  => $tauxTvaId,
                'tva'          => $tva,
                'qty'              => $qty,
                'pu_ht'            => $puHt,
                'pu_ttc'           => $line['pu_ttc'],
                'remise'           => $remise,
                'rm'               => $rm,
                'total_ht'         => $lineTotalHt,
                'total_ttc'        => $lineTotalTtc,
                'lots'             => $line['lots'] ?? [],
                'commande_achat_line_id' => $line['commande_achat_line_id'] ?? null,
            ];
        }

        return [$totalHt, $totalTtc, $linesData];
    }

    public function getReceptionWithLines(Reception $reception)
    {
        $reception->load(['lines.product', 'lines.purchaseUnit', 'branche']);
        
        $factureIds = \App\Models\FactureAchat::where('reception_id', $reception->id)
            ->where('status', '!=', 'annulee')
            ->pluck('id');

        $invoicedQuantities = \App\Models\FactureAchatLine::whereIn('facture_achat_id', $factureIds)
            ->groupBy('product_id')
            ->selectRaw('product_id, SUM(qty) as total_qty')
            ->pluck('total_qty', 'product_id');

        $lines = $reception->lines->map(function ($line) use ($invoicedQuantities) {
            $line->invoiced_qty = (double)($invoicedQuantities[$line->product_id] ?? 0);
            return $line;
        });

        $reception->setRelation('lines', $lines);

        return response()->json($reception);
    }
}
