<?php

namespace App\Http\Controllers;

use App\Models\CommandeAchat;
use App\Models\CommandeAchatLine;
use App\Models\Tier;
use App\Models\Product;
use App\Models\Devise;
use App\Models\Unit;
use App\Models\ModeReglement;
use App\Models\ConditionReglement;
use App\Models\CompteBancaire;
use App\Models\Entrepot;
use App\Models\Branche;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CommandeAchatController extends Controller
{
    public function index(Request $request): Response
    {
        $query = CommandeAchat::with(['tier', 'devise', 'modeReglement', 'conditionReglement', 'compteBancaire', 'receptions'])
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

        return Inertia::render('CommandeAchat/Index', [
            'commandes' => $query->paginate(10)->withQueryString(),
            'filters'   => $request->only('search', 'status'),
            'products'  => Product::where('status', 'actif')->with(['purchaseUnit', 'stockUnit'])->orderBy('label')->get(),
            'entrepots' => Entrepot::orderBy('label')->get(),
            'units'     => Unit::orderBy('label')->get(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('CommandeAchat/Create', [
            'tiers'               => Tier::where('type', 'fournisseur')->where('status', 'actif')->orderBy('label')->get(),
            'products'            => Product::where('status', 'actif')->with(['purchaseUnit', 'stockUnit'])->orderBy('label')->get(),
            'devises'             => Devise::orderBy('label')->get(),
            'units'               => Unit::orderBy('label')->get(),
            'modesReglement'      => ModeReglement::orderBy('label')->get(),
            'conditionsReglement' => ConditionReglement::orderBy('label')->get(),
            'comptesBancaires'    => CompteBancaire::orderBy('label')->get(),
            'entrepots'           => Entrepot::orderBy('label')->get(),
            'branches'            => Branche::orderBy('name')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'tier_id'                => ['required', 'exists:tiers,id'],
            'date_commande'          => ['required', 'date'],
            'date_livraison'         => ['nullable', 'date'],
            'devise_id'              => ['required', 'exists:devises,id'],
            'branche_id'             => ['required', 'exists:branches,id'],
            'mode_reglement_id'      => ['nullable', 'exists:modes_reglement,id'],
            'condition_reglement_id' => ['nullable', 'exists:conditions_reglement,id'],
            'compte_bancaire_id'     => ['nullable', 'exists:comptes_bancaires,id'],
            'note_public'            => ['nullable', 'string'],
            'note_private'           => ['nullable', 'string'],
            'demande_prix_id'        => ['nullable', 'exists:demandes_prix,id'],
            'lines'                  => ['required', 'array', 'min:1'],
            'lines.*.demande_prix_line_id' => ['nullable', 'exists:demande_prix_lines,id'],
            'lines.*.product_id'     => ['required', 'exists:products,id'],
            'lines.*.entrepot_id'    => ['required', 'exists:entrepots,id'],
            'lines.*.purchase_unit_id' => ['nullable', 'exists:units,id'],
            'lines.*.tva'            => ['required', 'numeric', 'min:0'],
            'lines.*.qty'            => ['required', 'numeric', 'min:0.0001'],
            'lines.*.pu_ht'          => ['required', 'numeric', 'min:0'],
            'lines.*.pu_ttc'         => ['required', 'numeric', 'min:0'],
            'lines.*.remise'         => ['nullable', 'numeric', 'min:0', 'max:100'],
            'lines.*.rm'             => ['nullable', 'numeric', 'min:0'],
            'lines.*.lots'           => ['nullable', 'array'],
            'lines.*.lots.*.lot_number' => ['required_with:lines.*.lots', 'string'],
            'lines.*.lots.*.quantity' => ['required_with:lines.*.lots', 'numeric', 'min:0.0001'],
            'lines.*.lots.*.fabrication_date' => ['nullable', 'date'],
            'lines.*.lots.*.expiration_date' => ['nullable', 'date'],
        ]);

        DB::transaction(function () use ($request) {
            // Generate Reference automatically: CCA-YYYYMM-XXXX
            $date  = date('Ym', strtotime($request->input('date_commande')));
            $count = CommandeAchat::whereYear('date_commande', date('Y', strtotime($request->input('date_commande'))))
                ->whereMonth('date_commande', date('m', strtotime($request->input('date_commande'))))->count();
            $ref = 'CCA-' . $date . '-' . str_pad($count + 1, 4, '0', STR_PAD_LEFT);

            [$totalHt, $totalTtc, $linesData] = $this->calcLines($request->input('lines'));

            $commande = CommandeAchat::create([
                'ref'                    => $ref,
                'tier_id'                => $request->input('tier_id'),
                'date_commande'          => $request->input('date_commande'),
                'date_livraison'         => $request->input('date_livraison'),
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
                'demande_prix_id'        => $request->input('demande_prix_id'),
            ]);

            foreach ($linesData as $lData) {
                $createdLine = $commande->lines()->create([
                    'product_id'           => $lData['product_id'],
                    'entrepot_id'          => $lData['entrepot_id'],
                    'purchase_unit_id'     => $lData['purchase_unit_id'],
                    'tva'                  => $lData['tva'],
                    'qty'                  => $lData['qty'],
                    'pu_ht'                => $lData['pu_ht'],
                    'pu_ttc'               => $lData['pu_ttc'],
                    'remise'               => $lData['remise'],
                    'rm'                   => $lData['rm'],
                    'total_ht'             => $lData['total_ht'],
                    'total_ttc'            => $lData['total_ttc'],
                    'demande_prix_line_id' => $lData['demande_prix_line_id'],
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

        if ($request->filled('demande_prix_id')) {
            $dem = \App\Models\DemandePrix::find($request->input('demande_prix_id'));
            if ($dem) {
                $dem->recalculateOrderStatus();
            }
        }

        return redirect()->route('commandes-achat.index')->with('success', 'Commande d\'achat créée avec succès.');
    }

    public function edit(CommandeAchat $commandesAchat): Response
    {
        $commandesAchat->load(['lines.product', 'lines.purchaseUnit', 'lines.entrepot', 'lines.lots']);

        return Inertia::render('CommandeAchat/Edit', [
            'commande'            => $commandesAchat,
            'tiers'               => Tier::where('type', 'fournisseur')->where('status', 'actif')->orderBy('label')->get(),
            'products'            => Product::where('status', 'actif')->with(['purchaseUnit', 'stockUnit'])->orderBy('label')->get(),
            'devises'             => Devise::orderBy('label')->get(),
            'units'               => Unit::orderBy('label')->get(),
            'modesReglement'      => ModeReglement::orderBy('label')->get(),
            'conditionsReglement' => ConditionReglement::orderBy('label')->get(),
            'comptesBancaires'    => CompteBancaire::orderBy('label')->get(),
            'entrepots'           => Entrepot::orderBy('label')->get(),
            'branches'            => Branche::orderBy('name')->get(),
        ]);
    }

    public function update(Request $request, CommandeAchat $commandesAchat): RedirectResponse
    {
        if ($commandesAchat->status === 'recue') {
            return back()->with('error', 'Une commande reçue ne peut pas être modifiée.');
        }

        $request->validate([
            'tier_id'                => ['required', 'exists:tiers,id'],
            'date_commande'          => ['required', 'date'],
            'date_livraison'         => ['nullable', 'date'],
            'devise_id'              => ['required', 'exists:devises,id'],
            'branche_id'             => ['required', 'exists:branches,id'],
            'mode_reglement_id'      => ['nullable', 'exists:modes_reglement,id'],
            'condition_reglement_id' => ['nullable', 'exists:conditions_reglement,id'],
            'compte_bancaire_id'     => ['nullable', 'exists:comptes_bancaires,id'],
            'note_public'            => ['nullable', 'string'],
            'note_private'           => ['nullable', 'string'],
            'demande_prix_id'        => ['nullable', 'exists:demandes_prix,id'],
            'lines'                  => ['required', 'array', 'min:1'],
            'lines.*.demande_prix_line_id' => ['nullable', 'exists:demande_prix_lines,id'],
            'lines.*.product_id'     => ['required', 'exists:products,id'],
            'lines.*.entrepot_id'    => ['required', 'exists:entrepots,id'],
            'lines.*.purchase_unit_id' => ['nullable', 'exists:units,id'],
            'lines.*.tva'            => ['required', 'numeric', 'min:0'],
            'lines.*.qty'            => ['required', 'numeric', 'min:0.0001'],
            'lines.*.pu_ht'          => ['required', 'numeric', 'min:0'],
            'lines.*.pu_ttc'         => ['required', 'numeric', 'min:0'],
            'lines.*.remise'         => ['nullable', 'numeric', 'min:0', 'max:100'],
            'lines.*.rm'             => ['nullable', 'numeric', 'min:0'],
            'lines.*.lots'           => ['nullable', 'array'],
            'lines.*.lots.*.lot_number' => ['required_with:lines.*.lots', 'string'],
            'lines.*.lots.*.quantity' => ['required_with:lines.*.lots', 'numeric', 'min:0.0001'],
            'lines.*.lots.*.fabrication_date' => ['nullable', 'date'],
            'lines.*.lots.*.expiration_date' => ['nullable', 'date'],
        ]);

        $oldDemandeId = $commandesAchat->demande_prix_id;
        $newDemandeId = $request->input('demande_prix_id');

        DB::transaction(function () use ($request, $commandesAchat, $newDemandeId) {
            [$totalHt, $totalTtc, $linesData] = $this->calcLines($request->input('lines'));

            $commandesAchat->update([
                'tier_id'                => $request->input('tier_id'),
                'date_commande'          => $request->input('date_commande'),
                'date_livraison'         => $request->input('date_livraison'),
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
                'demande_prix_id'        => $newDemandeId,
            ]);

            $commandesAchat->lines()->delete();
            foreach ($linesData as $lData) {
                $createdLine = $commandesAchat->lines()->create([
                    'product_id'           => $lData['product_id'],
                    'entrepot_id'          => $lData['entrepot_id'],
                    'purchase_unit_id'     => $lData['purchase_unit_id'],
                    'tva'                  => $lData['tva'],
                    'qty'                  => $lData['qty'],
                    'pu_ht'                => $lData['pu_ht'],
                    'pu_ttc'               => $lData['pu_ttc'],
                    'remise'               => $lData['remise'],
                    'rm'                   => $lData['rm'],
                    'total_ht'             => $lData['total_ht'],
                    'total_ttc'            => $lData['total_ttc'],
                    'demande_prix_line_id' => $lData['demande_prix_line_id'],
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

        if ($newDemandeId) {
            $dem = \App\Models\DemandePrix::find($newDemandeId);
            if ($dem) { $dem->recalculateOrderStatus(); }
        }
        if ($oldDemandeId && $oldDemandeId != $newDemandeId) {
            $dem = \App\Models\DemandePrix::find($oldDemandeId);
            if ($dem) { $dem->recalculateOrderStatus(); }
        }

        return redirect()->route('commandes-achat.index')->with('success', 'Commande d\'achat mise à jour avec succès.');
    }

    public function destroy(CommandeAchat $commandesAchat): RedirectResponse
    {
        if ($commandesAchat->status === 'recue') {
            return back()->with('error', 'Une commande reçue ne peut pas être supprimée.');
        }

        $demandeId = $commandesAchat->demande_prix_id;
        $commandesAchat->delete();

        if ($demandeId) {
            $dem = \App\Models\DemandePrix::find($demandeId);
            if ($dem) { $dem->recalculateOrderStatus(); }
        }

        return redirect()->route('commandes-achat.index')->with('success', 'Commande d\'achat supprimée avec succès.');
    }

    public function updateStatus(Request $request, CommandeAchat $commandesAchat): RedirectResponse
    {
        $request->validate([
            'status' => ['required', 'string', 'in:brouillon,commandee,recue,annulee'],
        ]);

        $commandesAchat->update(['status' => $request->input('status')]);

        if ($commandesAchat->demande_prix_id) {
            $dem = \App\Models\DemandePrix::find($commandesAchat->demande_prix_id);
            if ($dem) { $dem->recalculateOrderStatus(); }
        }

        return back()->with('success', 'Statut de la commande mis à jour.');
    }

    public function getCommandeWithLines(CommandeAchat $commandesAchat)
    {
        $commandesAchat->load(['lines.product.stockUnit', 'lines.product.purchaseUnit', 'lines.purchaseUnit', 'tier', 'devise']);
        return response()->json($commandesAchat);
    }

    private function calcLines(array $lines): array
    {
        $totalHt = 0;
        $totalTtc = 0;
        $linesData = [];

        foreach ($lines as $line) {
            $qty    = (double)$line['qty'];
            $puHt   = (double)$line['pu_ht'];
            $tva    = (double)$line['tva'];
            $remise = (double)($line['remise'] ?? 0);
            $rm     = (double)($line['rm'] ?? 0);

            $lineHt      = $qty * $puHt;
            $discount    = ($lineHt * $remise / 100) + $rm;
            $lineTotalHt = max(0, $lineHt - $discount);
            $lineTotalTtc = $lineTotalHt * (1 + $tva / 100);

            $totalHt  += $lineTotalHt;
            $totalTtc += $lineTotalTtc;

            $linesData[] = [
                'demande_prix_line_id' => $line['demande_prix_line_id'] ?? null,
                'product_id'       => $line['product_id'],
                'entrepot_id'      => $line['entrepot_id'],
                'purchase_unit_id' => $line['purchase_unit_id'] ?? null,
                'tva'              => $tva,
                'qty'              => $qty,
                'pu_ht'            => $puHt,
                'pu_ttc'           => $line['pu_ttc'],
                'remise'           => $remise,
                'rm'               => $rm,
                'total_ht'         => $lineTotalHt,
                'total_ttc'        => $lineTotalTtc,
                'lots'             => $line['lots'] ?? [],
            ];
        }

        return [$totalHt, $totalTtc, $linesData];
    }
}
