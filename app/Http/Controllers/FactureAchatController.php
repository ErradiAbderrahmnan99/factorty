<?php

namespace App\Http\Controllers;

use App\Models\FactureAchat;
use App\Models\TauxTva;
use App\Models\FactureAchatLine;
use App\Models\Tier;
use App\Models\Product;
use App\Models\Devise;
use App\Models\Unit;
use App\Models\Employee;
use App\Models\ModeReglement;
use App\Models\ConditionReglement;
use App\Models\Origine;
use App\Models\CompteBancaire;
use App\Models\TypeApprobateur;
use App\Models\StatutReglement;
use App\Models\Branche;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Exception;

class FactureAchatController extends Controller
{
    public function index(Request $request): Response
    {
        $query = FactureAchat::with(['tier', 'devise'])
            ->withSum('reglements', 'montant_ttc')
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

        return Inertia::render('FactureAchat/Index', [
            'factures' => $query->paginate(10)->withQueryString(),
            'filters'  => $request->only('search', 'status'),
            'tiers'    => Tier::where('status', 'actif')->orderBy('label')->get(),
            'modes'    => ModeReglement::orderBy('label')->get(),
            'comptes'  => CompteBancaire::orderBy('label')->get(),
            'statuts'  => StatutReglement::orderBy('label')->get(),
            'tauxTvas'  => TauxTva::where('actif', true)->orderBy('taux')->get(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('FactureAchat/Create', [
            'tiers'               => Tier::where('type', 'fournisseur')->where('status', 'actif')->orderBy('label')->get(),
            'products'            => Product::where('status', 'actif')->with(['purchaseUnit', 'stockUnit'])->orderBy('label')->get(),
            'devises'             => Devise::orderBy('label')->get(),
            'units'               => Unit::orderBy('label')->get(),
            'commercials'         => Employee::whereIn('type', ['commercial', 'agent'])->orderBy('last_name')->orderBy('first_name')->get(),
            'modesReglement'      => ModeReglement::orderBy('label')->get(),
            'conditionsReglement' => ConditionReglement::orderBy('label')->get(),
            'origines'            => Origine::orderBy('label')->get(),
            'comptesBancaires'    => CompteBancaire::orderBy('label')->get(),
            'typesApprobateur'     => TypeApprobateur::orderBy('label')->get(),
            'approbateurs'         => Tier::whereNotNull('type_approbateur_id')->with('typeApprobateur')->orderBy('label')->get(),
            'branches'             => Branche::orderBy('name')->get(),
            'tauxTvas'  => TauxTva::where('actif', true)->orderBy('taux')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'tier_id'                => ['required', 'exists:tiers,id'],
            'commercial'             => ['nullable', 'string', 'max:255'],
            'date_facture'           => ['required', 'date'],
            'date_echeance'          => ['nullable', 'date'],
            'devise_id'              => ['required', 'exists:devises,id'],
            'branche_id'             => ['required', 'exists:branches,id'],
            'mode_reglement_id'      => ['nullable', 'exists:modes_reglement,id'],
            'condition_reglement_id' => ['nullable', 'exists:conditions_reglement,id'],
            'origine_id'             => ['nullable', 'exists:origines,id'],
            'compte_bancaire_id'     => ['nullable', 'exists:comptes_bancaires,id'],
            'approbateur_id'         => ['nullable', 'exists:tiers,id'],
            'delai_livraison'        => ['nullable', 'integer', 'min:0'],
            'date_livraison'         => ['nullable', 'date'],
            'note_public'            => ['nullable', 'string'],
            'note_private'           => ['nullable', 'string'],
            'reception_id'           => ['nullable', 'exists:receptions,id'],
            'lines'                  => ['required', 'array', 'min:1'],
            'lines.*.product_id'     => ['required', 'exists:products,id'],
            'lines.*.purchase_unit_id' => ['nullable', 'exists:units,id'],
            'lines.*.taux_tva_id'    => ['required', 'exists:taux_tvas,id'],
            'lines.*.qty'            => ['required', 'numeric', 'min:0.0001'],
            'lines.*.pu_ht'          => ['required', 'numeric', 'min:0'],
            'lines.*.pu_ttc'         => ['required', 'numeric', 'min:0'],
            'lines.*.remise'         => ['nullable', 'numeric', 'min:0', 'max:100'],
            'lines.*.rm'             => ['nullable', 'numeric', 'min:0'],
        ]);

        $validationRedirect = $this->validateReceptionQuantities($request);
        if ($validationRedirect) {
            return $validationRedirect;
        }

        try {
            DB::transaction(function () use ($request) {
                $date  = date('Ym', strtotime($request->input('date_facture')));
                $count = FactureAchat::whereYear('date_facture', date('Y', strtotime($request->input('date_facture'))))
                    ->whereMonth('date_facture', date('m', strtotime($request->input('date_facture'))))->count();
                $ref = 'FA-' . $date . '-' . str_pad($count + 1, 4, '0', STR_PAD_LEFT);

                [$totalHt, $totalTtc, $linesData] = $this->calcLines($request->input('lines'));

                $facture = FactureAchat::create([
                    'ref'                    => $ref,
                    'tier_id'                => $request->input('tier_id'),
                    'commercial'             => $request->input('commercial'),
                    'date_facture'           => $request->input('date_facture'),
                    'date_echeance'          => $request->input('date_echeance'),
                    'devise_id'              => $request->input('devise_id'),
                    'branche_id'             => $request->input('branche_id'),
                    'mode_reglement_id'      => $request->input('mode_reglement_id'),
                    'condition_reglement_id' => $request->input('condition_reglement_id'),
                    'origine_id'             => $request->input('origine_id'),
                    'compte_bancaire_id'     => $request->input('compte_bancaire_id'),
                    'approbateur_id'         => $request->input('approbateur_id'),
                    'delai_livraison'        => $request->input('delai_livraison'),
                    'date_livraison'         => $request->input('date_livraison'),
                    'note_public'            => $request->input('note_public'),
                    'note_private'           => $request->input('note_private'),
                    'reception_id'           => $request->input('reception_id'),
                    'status'                 => 'brouillon',
                    'total_ht'               => $totalHt,
                    'total_tva'              => max(0, $totalTtc - $totalHt),
                    'total_ttc'              => $totalTtc,
                ]);

                foreach ($linesData as $lData) {
                    $facture->lines()->create($lData);
                }
            });
        } catch (Exception $e) {
            return back()->with('error', $e->getMessage());
        }

        if ($request->filled('reception_id')) {
            $reception = \App\Models\Reception::find($request->input('reception_id'));
            if ($reception) {
                $reception->syncFacturationStatus();
            }
        }

        return redirect()->route('factures-achat.index')->with('success', 'Facture fournisseur créée avec succès.');
    }

    public function edit(FactureAchat $facturesAchat): Response
    {
        $facturesAchat->load(['lines.tauxTva', 'lines.product', 'lines.purchaseUnit', 'approbateur.typeApprobateur']);

        return Inertia::render('FactureAchat/Edit', [
            'facture'             => $facturesAchat,
            'tiers'               => Tier::where('type', 'fournisseur')->where('status', 'actif')->orderBy('label')->get(),
            'products'            => Product::where('status', 'actif')->with(['purchaseUnit', 'stockUnit'])->orderBy('label')->get(),
            'devises'             => Devise::orderBy('label')->get(),
            'units'               => Unit::orderBy('label')->get(),
            'commercials'         => Employee::whereIn('type', ['commercial', 'agent'])->orderBy('last_name')->orderBy('first_name')->get(),
            'modesReglement'      => ModeReglement::orderBy('label')->get(),
            'conditionsReglement' => ConditionReglement::orderBy('label')->get(),
            'origines'            => Origine::orderBy('label')->get(),
            'comptesBancaires'    => CompteBancaire::orderBy('label')->get(),
            'typesApprobateur'     => TypeApprobateur::orderBy('label')->get(),
            'approbateurs'         => Tier::whereNotNull('type_approbateur_id')->with('typeApprobateur')->orderBy('label')->get(),
            'branches'             => Branche::orderBy('name')->get(),
            'tauxTvas'  => TauxTva::where('actif', true)->orderBy('taux')->get(),
        ]);
    }

    public function update(Request $request, FactureAchat $facturesAchat): RedirectResponse
    {
        if (in_array($facturesAchat->status, ['validee', 'payee', 'payee partiellement', 'annulee'])) {
            return redirect()->route('factures-achat.index')->with('error', 'Cette facture ne peut plus être modifiée.');
        }

        $request->validate([
            'tier_id'                => ['required', 'exists:tiers,id'],
            'commercial'             => ['nullable', 'string', 'max:255'],
            'date_facture'           => ['required', 'date'],
            'date_echeance'          => ['nullable', 'date'],
            'devise_id'              => ['required', 'exists:devises,id'],
            'branche_id'             => ['required', 'exists:branches,id'],
            'mode_reglement_id'      => ['nullable', 'exists:modes_reglement,id'],
            'condition_reglement_id' => ['nullable', 'exists:conditions_reglement,id'],
            'origine_id'             => ['nullable', 'exists:origines,id'],
            'compte_bancaire_id'     => ['nullable', 'exists:comptes_bancaires,id'],
            'approbateur_id'         => ['nullable', 'exists:tiers,id'],
            'delai_livraison'        => ['nullable', 'integer', 'min:0'],
            'date_livraison'         => ['nullable', 'date'],
            'note_public'            => ['nullable', 'string'],
            'note_private'           => ['nullable', 'string'],
            'reception_id'           => ['nullable', 'exists:receptions,id'],
            'lines'                  => ['required', 'array', 'min:1'],
            'lines.*.product_id'     => ['required', 'exists:products,id'],
            'lines.*.purchase_unit_id' => ['nullable', 'exists:units,id'],
            'lines.*.taux_tva_id'    => ['required', 'exists:taux_tvas,id'],
            'lines.*.qty'            => ['required', 'numeric', 'min:0.0001'],
            'lines.*.pu_ht'          => ['required', 'numeric', 'min:0'],
            'lines.*.pu_ttc'         => ['required', 'numeric', 'min:0'],
            'lines.*.remise'         => ['nullable', 'numeric', 'min:0', 'max:100'],
            'lines.*.rm'             => ['nullable', 'numeric', 'min:0'],
        ]);

        $validationRedirect = $this->validateReceptionQuantities($request, $facturesAchat);
        if ($validationRedirect) {
            return $validationRedirect;
        }

        $oldReceptionId = $facturesAchat->reception_id;

        try {
            DB::transaction(function () use ($request, $facturesAchat) {
                [$totalHt, $totalTtc, $linesData] = $this->calcLines($request->input('lines'));

                $facturesAchat->update([
                    'tier_id'                => $request->input('tier_id'),
                    'commercial'             => $request->input('commercial'),
                    'date_facture'           => $request->input('date_facture'),
                    'date_echeance'          => $request->input('date_echeance'),
                    'devise_id'              => $request->input('devise_id'),
                    'branche_id'             => $request->input('branche_id'),
                    'mode_reglement_id'      => $request->input('mode_reglement_id'),
                    'condition_reglement_id' => $request->input('condition_reglement_id'),
                    'origine_id'             => $request->input('origine_id'),
                    'compte_bancaire_id'     => $request->input('compte_bancaire_id'),
                    'approbateur_id'         => $request->input('approbateur_id'),
                    'delai_livraison'        => $request->input('delai_livraison'),
                    'date_livraison'         => $request->input('date_livraison'),
                    'note_public'            => $request->input('note_public'),
                    'note_private'           => $request->input('note_private'),
                    'reception_id'           => $request->input('reception_id'),
                    'total_ht'               => $totalHt,
                    'total_tva'              => max(0, $totalTtc - $totalHt),
                    'total_ttc'              => $totalTtc,
                ]);

                $facturesAchat->lines()->delete();
                foreach ($linesData as $lData) {
                    $facturesAchat->lines()->create($lData);
                }
            });
        } catch (Exception $e) {
            return back()->with('error', $e->getMessage());
        }

        if ($oldReceptionId) {
            $oldRec = \App\Models\Reception::find($oldReceptionId);
            if ($oldRec) {
                $oldRec->syncFacturationStatus();
            }
        }
        if ($facturesAchat->reception_id) {
            $facturesAchat->reception->syncFacturationStatus();
        }

        return redirect()->route('factures-achat.index')->with('success', 'Facture fournisseur mise à jour avec succès.');
    }

	public function destroy(FactureAchat $facturesAchat): RedirectResponse
    {
        if (in_array($facturesAchat->status, ['validee', 'payee', 'payee partiellement'])) {
            return back()->with('error', 'Une facture validée, payée ou partiellement payée ne peut pas être supprimée.');
        }

        $receptionId = $facturesAchat->reception_id;
        $facturesAchat->delete();

        if ($receptionId) {
            $reception = \App\Models\Reception::find($receptionId);
            if ($reception) {
                $reception->syncFacturationStatus();
            }
        }

        return redirect()->route('factures-achat.index')->with('success', 'Facture fournisseur supprimée avec succès.');
    }

	public function updateStatus(Request $request, FactureAchat $facturesAchat): RedirectResponse
    {
        if (in_array($facturesAchat->status, ['payee', 'payee partiellement'])) {
            return back()->with('error', 'Le statut d\'une facture payée ou partiellement payée ne peut pas être modifié manuellement.');
        }

        if ($facturesAchat->status === 'annulee') {
            return back()->with('error', 'Une facture annulée ne peut plus changer de statut.');
        }

        $request->validate([
            'status' => ['required', 'string', 'in:brouillon,validee,annulee'],
        ]);

        $facturesAchat->update(['status' => $request->input('status')]);

        if ($facturesAchat->reception_id) {
            $facturesAchat->reception->syncFacturationStatus();
        }

        return back()->with('success', 'Statut de la facture mis à jour.');
    }

    public function getFactureWithLines(FactureAchat $facture)
    {
        $facture->load(['lines.tauxTva', 'lines.product', 'lines.purchaseUnit']);
        return response()->json($facture);
    }

    private function validateReceptionQuantities(Request $request, ?FactureAchat $facture = null): ?RedirectResponse
    {
        if ($request->filled('reception_id')) {
            $reception = \App\Models\Reception::with('lines')->find($request->input('reception_id'));
            if (!$reception) {
                return null;
            }

            $query = FactureAchat::where('reception_id', $reception->id)
                ->where('status', '!=', 'annulee');
            
            if ($facture) {
                $query->where('id', '!=', $facture->id);
            }

            $factureIds = $query->pluck('id');

            $invoicedQuantities = FactureAchatLine::whereIn('facture_achat_id', $factureIds)
                ->groupBy('product_id')
                ->selectRaw('product_id, SUM(qty) as total_qty')
                ->pluck('total_qty', 'product_id');

            $receptionQuantities = [];
            foreach ($reception->lines as $line) {
                $receivedQty = (double)$line->qty;
                $alreadyInvoicedQty = (double)($invoicedQuantities[$line->product_id] ?? 0);
                $receptionQuantities[$line->product_id] = max(0, $receivedQty - $alreadyInvoicedQty);
            }

            foreach ($request->input('lines') as $index => $line) {
                $productId = $line['product_id'];
                $qty = (double)$line['qty'];

                if (!isset($receptionQuantities[$productId])) {
                    return back()->withErrors(["lines.{$index}.product_id" => "Ce produit n'est pas présent dans le bon de réception."]);
                }

                $remainingQty = $receptionQuantities[$productId];
                if (round($qty, 4) > round($remainingQty, 4)) {
                    return back()->withErrors(["lines.{$index}.qty" => "La quantité facturée dépasse la quantité restante du bon de réception (Restant: {$remainingQty})."]);
                }
            }
        }

        return null;
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
                'purchase_unit_id' => $line['purchase_unit_id'] ?? null,
                'taux_tva_id'  => $tauxTvaId,
                'qty'              => $qty,
                'pu_ht'            => $puHt,
                'pu_ttc'           => $line['pu_ttc'],
                'remise'           => $remise,
                'rm'               => $rm,
                'total_ht'         => $lineTotalHt,
                'total_ttc'        => $lineTotalTtc,
            ];
        }

        return [$totalHt, $totalTtc, $linesData];
    }
}
