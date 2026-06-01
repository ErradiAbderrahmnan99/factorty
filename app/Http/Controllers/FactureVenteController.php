<?php

namespace App\Http\Controllers;

use App\Models\FactureVente;
use App\Models\FactureVenteLine;
use App\Models\Tier;
use App\Models\Product;
use App\Models\Devise;
use App\Models\Unit;
use App\Models\Employee;
use App\Models\ModeReglement;
use App\Models\ConditionReglement;
use App\Models\Origine;
use App\Models\CompteBancaire;
use App\Models\TypeApporteur;
use App\Models\Apporteur;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class FactureVenteController extends Controller
{
    public function index(Request $request): Response
    {
        $query = FactureVente::with(['tier', 'devise', 'modeReglement', 'conditionReglement', 'origine', 'compteBancaire', 'typeApporteur', 'apporteur'])
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

        return Inertia::render('FactureVente/Index', [
            'factures' => $query->paginate(10)->withQueryString(),
            'filters'  => $request->only('search', 'status'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('FactureVente/Create', [
            'tiers'               => Tier::where('type', 'client')->where('status', 'actif')->orderBy('label')->get(),
            'products'            => Product::where('status', 'actif')->with(['saleUnit', 'stockUnit'])->orderBy('label')->get(),
            'devises'             => Devise::orderBy('label')->get(),
            'units'               => Unit::orderBy('label')->get(),
            'commercials'         => Employee::whereIn('type', ['commercial', 'agent'])->orderBy('last_name')->orderBy('first_name')->get(),
            'modesReglement'      => ModeReglement::orderBy('label')->get(),
            'conditionsReglement' => ConditionReglement::orderBy('label')->get(),
            'origines'            => Origine::orderBy('label')->get(),
            'comptesBancaires'    => CompteBancaire::orderBy('label')->get(),
            'typesApporteur'      => TypeApporteur::orderBy('label')->get(),
            'apporteurs'          => Apporteur::orderBy('label')->get(),
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
            'mode_reglement_id'      => ['nullable', 'exists:modes_reglement,id'],
            'condition_reglement_id' => ['nullable', 'exists:conditions_reglement,id'],
            'origine_id'             => ['nullable', 'exists:origines,id'],
            'compte_bancaire_id'     => ['nullable', 'exists:comptes_bancaires,id'],
            'type_apporteur_id'      => ['nullable', 'exists:types_apporteur,id'],
            'apporteur_id'          => ['nullable', 'exists:apporteurs,id'],
            'delai_livraison'        => ['nullable', 'integer', 'min:0'],
            'date_livraison'         => ['nullable', 'date'],
            'note_public'            => ['nullable', 'string'],
            'note_private'           => ['nullable', 'string'],
            'lines'                  => ['required', 'array', 'min:1'],
            'lines.*.product_id'     => ['required', 'exists:products,id'],
            'lines.*.sale_unit_id'   => ['nullable', 'exists:units,id'],
            'lines.*.tva'            => ['required', 'numeric', 'min:0'],
            'lines.*.qty'            => ['required', 'numeric', 'min:0.0001'],
            'lines.*.pu_ht'          => ['required', 'numeric', 'min:0'],
            'lines.*.pu_ttc'         => ['required', 'numeric', 'min:0'],
            'lines.*.remise'         => ['nullable', 'numeric', 'min:0', 'max:100'],
            'lines.*.rm'             => ['nullable', 'numeric', 'min:0'],
        ]);

        DB::transaction(function () use ($request) {
            $date  = date('Ym', strtotime($request->input('date_facture')));
            $count = FactureVente::whereYear('date_facture', date('Y', strtotime($request->input('date_facture'))))
                ->whereMonth('date_facture', date('m', strtotime($request->input('date_facture'))))->count();
            $ref = 'FV-' . $date . '-' . str_pad($count + 1, 4, '0', STR_PAD_LEFT);

            [$totalHt, $totalTtc, $linesData] = $this->calcLines($request->input('lines'));

            $facture = FactureVente::create([
                'ref'                    => $ref,
                'tier_id'                => $request->input('tier_id'),
                'commercial'             => $request->input('commercial'),
                'date_facture'           => $request->input('date_facture'),
                'date_echeance'          => $request->input('date_echeance'),
                'devise_id'              => $request->input('devise_id'),
                'mode_reglement_id'      => $request->input('mode_reglement_id'),
                'condition_reglement_id' => $request->input('condition_reglement_id'),
                'origine_id'             => $request->input('origine_id'),
                'compte_bancaire_id'     => $request->input('compte_bancaire_id'),
                'type_apporteur_id'      => $request->input('type_apporteur_id'),
                'apporteur_id'          => $request->input('apporteur_id'),
                'delai_livraison'        => $request->input('delai_livraison'),
                'date_livraison'         => $request->input('date_livraison'),
                'note_public'            => $request->input('note_public'),
                'note_private'           => $request->input('note_private'),
                'status'                 => 'brouillon',
                'total_ht'               => $totalHt,
                'total_tva'              => max(0, $totalTtc - $totalHt),
                'total_ttc'              => $totalTtc,
            ]);

            foreach ($linesData as $lData) {
                $facture->lines()->create($lData);
            }
        });

        return redirect()->route('factures-vente.index')->with('success', 'Facture de vente créée avec succès.');
    }

    public function edit(FactureVente $facturesVente): Response
    {
        $facturesVente->load(['lines.product', 'lines.saleUnit']);

        return Inertia::render('FactureVente/Edit', [
            'facture'             => $facturesVente,
            'tiers'               => Tier::where('type', 'client')->where('status', 'actif')->orderBy('label')->get(),
            'products'            => Product::where('status', 'actif')->with(['saleUnit', 'stockUnit'])->orderBy('label')->get(),
            'devises'             => Devise::orderBy('label')->get(),
            'units'               => Unit::orderBy('label')->get(),
            'commercials'         => Employee::whereIn('type', ['commercial', 'agent'])->orderBy('last_name')->orderBy('first_name')->get(),
            'modesReglement'      => ModeReglement::orderBy('label')->get(),
            'conditionsReglement' => ConditionReglement::orderBy('label')->get(),
            'origines'            => Origine::orderBy('label')->get(),
            'comptesBancaires'    => CompteBancaire::orderBy('label')->get(),
            'typesApporteur'      => TypeApporteur::orderBy('label')->get(),
            'apporteurs'          => Apporteur::orderBy('label')->get(),
        ]);
    }

    public function update(Request $request, FactureVente $facturesVente): RedirectResponse
    {
        if (in_array($facturesVente->status, ['payee', 'annulee', 'envoyee'])) {
            return back()->with('error', 'Cette facture ne peut plus être modifiée.');
        }

        $request->validate([
            'tier_id'                => ['required', 'exists:tiers,id'],
            'commercial'             => ['nullable', 'string', 'max:255'],
            'date_facture'           => ['required', 'date'],
            'date_echeance'          => ['nullable', 'date'],
            'devise_id'              => ['required', 'exists:devises,id'],
            'mode_reglement_id'      => ['nullable', 'exists:modes_reglement,id'],
            'condition_reglement_id' => ['nullable', 'exists:conditions_reglement,id'],
            'origine_id'             => ['nullable', 'exists:origines,id'],
            'compte_bancaire_id'     => ['nullable', 'exists:comptes_bancaires,id'],
            'type_apporteur_id'      => ['nullable', 'exists:types_apporteur,id'],
            'apporteur_id'          => ['nullable', 'exists:apporteurs,id'],
            'delai_livraison'        => ['nullable', 'integer', 'min:0'],
            'date_livraison'         => ['nullable', 'date'],
            'note_public'            => ['nullable', 'string'],
            'note_private'           => ['nullable', 'string'],
            'lines'                  => ['required', 'array', 'min:1'],
            'lines.*.product_id'     => ['required', 'exists:products,id'],
            'lines.*.sale_unit_id'   => ['nullable', 'exists:units,id'],
            'lines.*.tva'            => ['required', 'numeric', 'min:0'],
            'lines.*.qty'            => ['required', 'numeric', 'min:0.0001'],
            'lines.*.pu_ht'          => ['required', 'numeric', 'min:0'],
            'lines.*.pu_ttc'         => ['required', 'numeric', 'min:0'],
            'lines.*.remise'         => ['nullable', 'numeric', 'min:0', 'max:100'],
            'lines.*.rm'             => ['nullable', 'numeric', 'min:0'],
        ]);

        DB::transaction(function () use ($request, $facturesVente) {
            [$totalHt, $totalTtc, $linesData] = $this->calcLines($request->input('lines'));

            $facturesVente->update([
                'tier_id'                => $request->input('tier_id'),
                'commercial'             => $request->input('commercial'),
                'date_facture'           => $request->input('date_facture'),
                'date_echeance'          => $request->input('date_echeance'),
                'devise_id'              => $request->input('devise_id'),
                'mode_reglement_id'      => $request->input('mode_reglement_id'),
                'condition_reglement_id' => $request->input('condition_reglement_id'),
                'origine_id'             => $request->input('origine_id'),
                'compte_bancaire_id'     => $request->input('compte_bancaire_id'),
                'type_apporteur_id'      => $request->input('type_apporteur_id'),
                'apporteur_id'          => $request->input('apporteur_id'),
                'delai_livraison'        => $request->input('delai_livraison'),
                'date_livraison'         => $request->input('date_livraison'),
                'note_public'            => $request->input('note_public'),
                'note_private'           => $request->input('note_private'),
                'total_ht'               => $totalHt,
                'total_tva'              => max(0, $totalTtc - $totalHt),
                'total_ttc'              => $totalTtc,
            ]);

            $facturesVente->lines()->delete();
            foreach ($linesData as $lData) {
                $facturesVente->lines()->create($lData);
            }
        });

        return redirect()->route('factures-vente.index')->with('success', 'Facture mise à jour avec succès.');
    }

    public function destroy(FactureVente $facturesVente): RedirectResponse
    {
        if (in_array($facturesVente->status, ['payee', 'envoyee'])) {
            return back()->with('error', 'Une facture envoyée ou payée ne peut pas être supprimée.');
        }
        $facturesVente->delete();
        return redirect()->route('factures-vente.index')->with('success', 'Facture supprimée avec succès.');
    }

    public function updateStatus(Request $request, FactureVente $facturesVente): RedirectResponse
    {
        $request->validate([
            'status' => ['required', 'string', 'in:brouillon,envoyee,payee,annulee'],
        ]);

        $facturesVente->update(['status' => $request->input('status')]);
        return back()->with('success', 'Statut de la facture mis à jour.');
    }

    public function getFactureWithLines(\App\Models\FactureVente $facture)
    {
        $facture->load(['lines.product', 'lines.saleUnit']);
        return response()->json($facture);
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
                'product_id'   => $line['product_id'],
                'sale_unit_id' => $line['sale_unit_id'] ?? null,
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
