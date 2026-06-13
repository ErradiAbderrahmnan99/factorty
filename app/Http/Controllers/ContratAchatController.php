<?php

namespace App\Http\Controllers;

use App\Models\ContratAchat;
use App\Models\ContratAchatLine;
use App\Models\Tier;
use App\Models\Product;
use App\Models\Devise;
use App\Models\Unit;
use App\Models\ModeReglement;
use App\Models\ConditionReglement;
use App\Models\CompteBancaire;
use App\Models\Branche;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ContratAchatController extends Controller
{
    public function index(Request $request): Response
    {
        $query = ContratAchat::with(['tier', 'devise', 'modeReglement', 'conditionReglement', 'compteBancaire'])
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

        return Inertia::render('ContratAchat/Index', [
            'contrats' => $query->paginate(10)->withQueryString(),
            'filters'  => $request->only('search', 'status'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('ContratAchat/Create', [
            'tiers'               => Tier::where('type', 'fournisseur')->where('status', 'actif')->orderBy('label')->get(),
            'products'            => Product::where('status', 'actif')->with(['purchaseUnit', 'stockUnit'])->orderBy('label')->get(),
            'devises'             => Devise::orderBy('label')->get(),
            'units'               => Unit::orderBy('label')->get(),
            'modesReglement'      => ModeReglement::orderBy('label')->get(),
            'conditionsReglement' => ConditionReglement::orderBy('label')->get(),
            'comptesBancaires'    => CompteBancaire::orderBy('label')->get(),
            'branches'            => Branche::orderBy('name')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'tier_id'                => ['required', 'exists:tiers,id'],
            'date_contrat'           => ['required', 'date'],
            'date_echeance'          => ['nullable', 'date'],
            'devise_id'              => ['required', 'exists:devises,id'],
            'branche_id'             => ['required', 'exists:branches,id'],
            'mode_reglement_id'      => ['nullable', 'exists:modes_reglement,id'],
            'condition_reglement_id' => ['nullable', 'exists:conditions_reglement,id'],
            'compte_bancaire_id'     => ['nullable', 'exists:comptes_bancaires,id'],
            'note_public'            => ['nullable', 'string'],
            'note_private'           => ['nullable', 'string'],
            'lines'                  => ['required', 'array', 'min:1'],
            'lines.*.product_id'     => ['required', 'exists:products,id'],
            'lines.*.purchase_unit_id' => ['nullable', 'exists:units,id'],
            'lines.*.tva'            => ['required', 'numeric', 'min:0'],
            'lines.*.qty'            => ['required', 'numeric', 'min:0.0001'],
            'lines.*.pu_ht'          => ['required', 'numeric', 'min:0'],
            'lines.*.pu_ttc'         => ['required', 'numeric', 'min:0'],
            'lines.*.remise'         => ['nullable', 'numeric', 'min:0', 'max:100'],
            'lines.*.rm'             => ['nullable', 'numeric', 'min:0'],
        ]);

        DB::transaction(function () use ($request) {
            $date  = date('Ym', strtotime($request->input('date_contrat')));
            $count = ContratAchat::whereYear('date_contrat', date('Y', strtotime($request->input('date_contrat'))))
                ->whereMonth('date_contrat', date('m', strtotime($request->input('date_contrat'))))->count();
            $ref = 'CA-' . $date . '-' . str_pad($count + 1, 4, '0', STR_PAD_LEFT);

            [$totalHt, $totalTtc, $linesData] = $this->calcLines($request->input('lines'));

            $contrat = ContratAchat::create([
                'ref'                    => $ref,
                'tier_id'                => $request->input('tier_id'),
                'date_contrat'           => $request->input('date_contrat'),
                'date_echeance'          => $request->input('date_echeance'),
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
            ]);

            foreach ($linesData as $lData) {
                $contrat->lines()->create($lData);
            }
        });

        return redirect()->route('contrats-achat.index')->with('success', 'Contrat d\'achat créé avec succès.');
    }

    public function edit(ContratAchat $contratsAchat): Response
    {
        $contratsAchat->load(['lines.product', 'lines.purchaseUnit']);

        return Inertia::render('ContratAchat/Edit', [
            'contrat'             => $contratsAchat,
            'tiers'               => Tier::where('type', 'fournisseur')->where('status', 'actif')->orderBy('label')->get(),
            'products'            => Product::where('status', 'actif')->with(['purchaseUnit', 'stockUnit'])->orderBy('label')->get(),
            'devises'             => Devise::orderBy('label')->get(),
            'units'               => Unit::orderBy('label')->get(),
            'modesReglement'      => ModeReglement::orderBy('label')->get(),
            'conditionsReglement' => ConditionReglement::orderBy('label')->get(),
            'comptesBancaires'    => CompteBancaire::orderBy('label')->get(),
            'branches'            => Branche::orderBy('name')->get(),
        ]);
    }

    public function update(Request $request, ContratAchat $contratsAchat): RedirectResponse
    {
        $request->validate([
            'tier_id'                => ['required', 'exists:tiers,id'],
            'date_contrat'           => ['required', 'date'],
            'date_echeance'          => ['nullable', 'date'],
            'devise_id'              => ['required', 'exists:devises,id'],
            'branche_id'             => ['required', 'exists:branches,id'],
            'mode_reglement_id'      => ['nullable', 'exists:modes_reglement,id'],
            'condition_reglement_id' => ['nullable', 'exists:conditions_reglement,id'],
            'compte_bancaire_id'     => ['nullable', 'exists:comptes_bancaires,id'],
            'note_public'            => ['nullable', 'string'],
            'note_private'           => ['nullable', 'string'],
            'lines'                  => ['required', 'array', 'min:1'],
            'lines.*.product_id'     => ['required', 'exists:products,id'],
            'lines.*.purchase_unit_id' => ['nullable', 'exists:units,id'],
            'lines.*.tva'            => ['required', 'numeric', 'min:0'],
            'lines.*.qty'            => ['required', 'numeric', 'min:0.0001'],
            'lines.*.pu_ht'          => ['required', 'numeric', 'min:0'],
            'lines.*.pu_ttc'         => ['required', 'numeric', 'min:0'],
            'lines.*.remise'         => ['nullable', 'numeric', 'min:0', 'max:100'],
            'lines.*.rm'             => ['nullable', 'numeric', 'min:0'],
        ]);

        DB::transaction(function () use ($request, $contratsAchat) {
            [$totalHt, $totalTtc, $linesData] = $this->calcLines($request->input('lines'));

            $contratsAchat->update([
                'tier_id'                => $request->input('tier_id'),
                'date_contrat'           => $request->input('date_contrat'),
                'date_echeance'          => $request->input('date_echeance'),
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
            ]);

            $contratsAchat->lines()->delete();
            foreach ($linesData as $lData) {
                $contratsAchat->lines()->create($lData);
            }
        });

        return redirect()->route('contrats-achat.index')->with('success', 'Contrat mis à jour avec succès.');
    }

    public function destroy(ContratAchat $contratsAchat): RedirectResponse
    {
        $contratsAchat->delete();
        return redirect()->route('contrats-achat.index')->with('success', 'Contrat supprimé avec succès.');
    }

    public function updateStatus(Request $request, ContratAchat $contratsAchat): RedirectResponse
    {
        $request->validate([
            'status' => ['required', 'string', 'in:brouillon,actif,suspendu,expire,annule'],
        ]);

        $contratsAchat->update(['status' => $request->input('status')]);
        return back()->with('success', 'Statut de contrat mis à jour.');
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
                'product_id'       => $line['product_id'],
                'purchase_unit_id' => $line['purchase_unit_id'] ?? null,
                'tva'              => $tva,
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
