<?php

namespace App\Http\Controllers;

use App\Models\AvoirVente;
use App\Models\TauxTva;
use App\Models\AvoirVenteLine;
use App\Models\Tier;
use App\Models\Product;
use App\Models\Devise;
use App\Models\Unit;
use App\Models\Employee;
use App\Models\ModeReglement;
use App\Models\ConditionReglement;
use App\Models\Origine;
use App\Models\TypeApprobateur;
use App\Models\CompteBancaire;
use App\Models\StatutReglement;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AvoirVenteController extends Controller
{
    public function index(Request $request): Response
    {
        $query = AvoirVente::with(['tier', 'devise', 'modeReglement', 'conditionReglement', 'origine', 'compteBancaire', 'approbateur.typeApprobateur'])
            ->withSum('reglements', 'montant_ttc')
            ->orderBy('created_at', 'desc');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('ref', 'like', "%{$search}%")
                  ->orWhere('commercial', 'like', "%{$search}%")
                  ->orWhereHas('tier', fn($tQ) => $tQ->where('label', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        return Inertia::render('AvoirVente/Index', [
            'avoirs'  => $query->paginate(10)->withQueryString(),
            'filters' => $request->only('search', 'status'),
            'tiers'   => Tier::where('status', 'actif')->orderBy('label')->get(),
            'modes'   => ModeReglement::orderBy('label')->get(),
            'comptes' => CompteBancaire::orderBy('label')->get(),
            'statuts' => StatutReglement::orderBy('label')->get(),
            'tauxTvas'  => TauxTva::where('actif', true)->orderBy('taux')->get(),
        ]);
    }

    public function create(): Response
    {
        $branches = \App\Models\Branche::orderBy('name')->get();

        return Inertia::render('AvoirVente/Create', [
            'factures'            => \App\Models\FactureVente::orderBy('ref', 'desc')->get(),
            'tiers'               => Tier::where('type', 'client')->where('status', 'actif')->orderBy('label')->get(),
            'products'            => Product::where('status', 'actif')->with(['saleUnit', 'stockUnit'])->orderBy('label')->get(),
            'devises'             => Devise::orderBy('label')->get(),
            'units'               => Unit::orderBy('label')->get(),
            'commercials'         => Employee::whereIn('type', ['commercial', 'agent'])->orderBy('last_name')->orderBy('first_name')->get(),
            'modesReglement'      => ModeReglement::orderBy('label')->get(),
            'conditionsReglement' => ConditionReglement::orderBy('label')->get(),
            'origines'            => Origine::orderBy('label')->get(),
            'comptesBancaires'    => CompteBancaire::orderBy('label')->get(),
            'typesApprobateur'     => TypeApprobateur::orderBy('label')->get(),
            'approbateurs'         => Tier::whereNotNull('type_approbateur_id')->with('typeApprobateur')->orderBy('label')->get(),
            'branches'            => $branches,
            'tauxTvas'  => TauxTva::where('actif', true)->orderBy('taux')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'tier_id'                => ['required', 'exists:tiers,id'],
            'facture_vente_id'       => ['nullable', 'exists:factures_vente,id'],
            'commercial'             => ['nullable', 'string', 'max:255'],
            'date_avoir'             => ['required', 'date'],
            'devise_id'              => ['required', 'exists:devises,id'],
            'mode_reglement_id'      => ['nullable', 'exists:modes_reglement,id'],
            'condition_reglement_id' => ['nullable', 'exists:conditions_reglement,id'],
            'origine_id'             => ['nullable', 'exists:origines,id'],
            'compte_bancaire_id'     => ['nullable', 'exists:comptes_bancaires,id'],
            'approbateur_id'         => ['nullable', 'exists:tiers,id'],
            'branche_id'             => ['nullable', 'exists:branches,id'],
            'delai_livraison'        => ['nullable', 'integer', 'min:0'],
            'date_livraison'         => ['nullable', 'date'],
            'note_public'            => ['nullable', 'string'],
            'note_private'           => ['nullable', 'string'],
            'lines'                  => ['required', 'array', 'min:1'],
            'lines.*.product_id'     => ['required', 'exists:products,id'],
            'lines.*.sale_unit_id'   => ['nullable', 'exists:units,id'],
            'lines.*.taux_tva_id'    => ['required', 'exists:taux_tvas,id'],
            'lines.*.qty'            => ['required', 'numeric', 'min:0.0001'],
            'lines.*.pu_ht'          => ['required', 'numeric', 'min:0'],
            'lines.*.pu_ttc'         => ['required', 'numeric', 'min:0'],
            'lines.*.remise'         => ['nullable', 'numeric', 'min:0', 'max:100'],
            'lines.*.rm'             => ['nullable', 'numeric', 'min:0'],
        ]);

        DB::transaction(function () use ($request) {
            $date  = date('Ym', strtotime($request->input('date_avoir')));
            $count = AvoirVente::whereYear('date_avoir', date('Y', strtotime($request->input('date_avoir'))))
                ->whereMonth('date_avoir', date('m', strtotime($request->input('date_avoir'))))->count();
            $ref = 'AV-' . $date . '-' . str_pad($count + 1, 4, '0', STR_PAD_LEFT);

            [$totalHt, $totalTtc, $linesData] = $this->calcLines($request->input('lines'));

            $avoir = AvoirVente::create([
                'ref'                    => $ref,
                'tier_id'                => $request->input('tier_id'),
                'facture_vente_id'       => $request->input('facture_vente_id'),
                'commercial'             => $request->input('commercial'),
                'date_avoir'             => $request->input('date_avoir'),
                'devise_id'              => $request->input('devise_id'),
                'mode_reglement_id'      => $request->input('mode_reglement_id'),
                'condition_reglement_id' => $request->input('condition_reglement_id'),
                'origine_id'             => $request->input('origine_id'),
                'compte_bancaire_id'     => $request->input('compte_bancaire_id'),
                'approbateur_id'         => $request->input('approbateur_id'),
                'delai_livraison'        => $request->input('delai_livraison'),
                'date_livraison'         => $request->input('date_livraison'),
                'note_public'            => $request->input('note_public'),
                'note_private'           => $request->input('note_private'),
                'branche_id'             => $request->input('branche_id'),
                'status'                 => 'brouillon',
                'total_ht'               => $totalHt,
                'total_tva'              => max(0, $totalTtc - $totalHt),
                'total_ttc'              => $totalTtc,
            ]);

            foreach ($linesData as $lData) {
                $avoir->lines()->create($lData);
            }
        });

        return redirect()->route('avoirs-vente.index')->with('success', 'Avoir de vente créé avec succès.');
    }

    public function edit(AvoirVente $avoirsVente): Response
    {
        $avoirsVente->load(['lines.product', 'lines.saleUnit', 'approbateur.typeApprobateur']);
        $branches = \App\Models\Branche::orderBy('name')->get();

        return Inertia::render('AvoirVente/Edit', [
            'avoir'               => $avoirsVente,
            'factures'            => \App\Models\FactureVente::orderBy('ref', 'desc')->get(),
            'tiers'               => Tier::where('type', 'client')->where('status', 'actif')->orderBy('label')->get(),
            'products'            => Product::where('status', 'actif')->with(['saleUnit', 'stockUnit'])->orderBy('label')->get(),
            'devises'             => Devise::orderBy('label')->get(),
            'units'               => Unit::orderBy('label')->get(),
            'commercials'         => Employee::whereIn('type', ['commercial', 'agent'])->orderBy('last_name')->orderBy('first_name')->get(),
            'modesReglement'      => ModeReglement::orderBy('label')->get(),
            'conditionsReglement' => ConditionReglement::orderBy('label')->get(),
            'origines'            => Origine::orderBy('label')->get(),
            'comptesBancaires'    => CompteBancaire::orderBy('label')->get(),
            'typesApprobateur'     => TypeApprobateur::orderBy('label')->get(),
            'approbateurs'         => Tier::whereNotNull('type_approbateur_id')->with('typeApprobateur')->orderBy('label')->get(),
            'branches'            => $branches,
            'tauxTvas'  => TauxTva::where('actif', true)->orderBy('taux')->get(),
        ]);
    }

    public function update(Request $request, AvoirVente $avoirsVente): RedirectResponse
    {
        if (in_array($avoirsVente->status, ['valide', 'paye', 'paye partiellement'])) {
            return back()->with('error', 'Cet avoir ne peut plus être modifié.');
        }

        $request->validate([
            'tier_id'                => ['required', 'exists:tiers,id'],
            'facture_vente_id'       => ['nullable', 'exists:factures_vente,id'],
            'commercial'             => ['nullable', 'string', 'max:255'],
            'date_avoir'             => ['required', 'date'],
            'devise_id'              => ['required', 'exists:devises,id'],
            'mode_reglement_id'      => ['nullable', 'exists:modes_reglement,id'],
            'condition_reglement_id' => ['nullable', 'exists:conditions_reglement,id'],
            'origine_id'             => ['nullable', 'exists:origines,id'],
            'compte_bancaire_id'     => ['nullable', 'exists:comptes_bancaires,id'],
            'approbateur_id'         => ['nullable', 'exists:tiers,id'],
            'branche_id'             => ['nullable', 'exists:branches,id'],
            'delai_livraison'        => ['nullable', 'integer', 'min:0'],
            'date_livraison'         => ['nullable', 'date'],
            'note_public'            => ['nullable', 'string'],
            'note_private'           => ['nullable', 'string'],
            'lines'                  => ['required', 'array', 'min:1'],
            'lines.*.product_id'     => ['required', 'exists:products,id'],
            'lines.*.sale_unit_id'   => ['nullable', 'exists:units,id'],
            'lines.*.taux_tva_id'    => ['required', 'exists:taux_tvas,id'],
            'lines.*.qty'            => ['required', 'numeric', 'min:0.0001'],
            'lines.*.pu_ht'          => ['required', 'numeric', 'min:0'],
            'lines.*.pu_ttc'         => ['required', 'numeric', 'min:0'],
            'lines.*.remise'         => ['nullable', 'numeric', 'min:0', 'max:100'],
            'lines.*.rm'             => ['nullable', 'numeric', 'min:0'],
        ]);

        DB::transaction(function () use ($request, $avoirsVente) {
            [$totalHt, $totalTtc, $linesData] = $this->calcLines($request->input('lines'));

            $avoirsVente->update([
                'tier_id'                => $request->input('tier_id'),
                'facture_vente_id'       => $request->input('facture_vente_id'),
                'commercial'             => $request->input('commercial'),
                'date_avoir'             => $request->input('date_avoir'),
                'devise_id'              => $request->input('devise_id'),
                'mode_reglement_id'      => $request->input('mode_reglement_id'),
                'condition_reglement_id' => $request->input('condition_reglement_id'),
                'origine_id'             => $request->input('origine_id'),
                'compte_bancaire_id'     => $request->input('compte_bancaire_id'),
                'approbateur_id'         => $request->input('approbateur_id'),
                'delai_livraison'        => $request->input('delai_livraison'),
                'date_livraison'         => $request->input('date_livraison'),
                'note_public'            => $request->input('note_public'),
                'note_private'           => $request->input('note_private'),
                'branche_id'             => $request->input('branche_id'),
                'total_ht'               => $totalHt,
                'total_tva'              => max(0, $totalTtc - $totalHt),
                'total_ttc'              => $totalTtc,
            ]);

            $avoirsVente->lines()->delete();
            foreach ($linesData as $lData) {
                $avoirsVente->lines()->create($lData);
            }
        });

        return redirect()->route('avoirs-vente.index')->with('success', 'Avoir mis à jour avec succès.');
    }

    public function destroy(AvoirVente $avoirsVente): RedirectResponse
    {
        if (in_array($avoirsVente->status, ['valide', 'paye', 'paye partiellement'])) {
            return back()->with('error', 'Un avoir validé ou payé ne peut pas être supprimé.');
        }
        $avoirsVente->delete();
        return redirect()->route('avoirs-vente.index')->with('success', 'Avoir supprimé avec succès.');
    }

    public function updateStatus(Request $request, AvoirVente $avoirsVente): RedirectResponse
    {
        if (in_array($avoirsVente->status, ['paye', 'paye partiellement'])) {
            return back()->with('error', 'Le statut d\'un avoir payé ou partiellement payé ne peut pas être modifié manuellement.');
        }

        $request->validate([
            'status' => ['required', 'string', 'in:brouillon,valide,annule,paye,paye partiellement'],
        ]);

        $avoirsVente->update(['status' => $request->input('status')]);
        return back()->with('success', 'Statut de l\'avoir mis à jour.');
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

            $lineHt       = $qty * $puHt;
            $discount     = ($lineHt * $remise / 100) + $rm;
            $lineTotalHt  = max(0, $lineHt - $discount);
            $lineTotalTtc = $lineTotalHt * (1 + $tva / 100);

            $totalHt  += $lineTotalHt;
            $totalTtc += $lineTotalTtc;

            $linesData[] = [
                'product_id'   => $line['product_id'],
                'sale_unit_id' => $line['sale_unit_id'] ?? null,
                'taux_tva_id'  => $tauxTvaId,
                'tva'          => $tva,
                'qty'          => $qty,
                'pu_ht'        => $puHt,
                'pu_ttc'       => $line['pu_ttc'],
                'remise'       => $remise,
                'rm'           => $rm,
                'total_ht'     => $lineTotalHt,
                'total_ttc'    => $lineTotalTtc,
            ];
        }

        return [$totalHt, $totalTtc, $linesData];
    }
}
