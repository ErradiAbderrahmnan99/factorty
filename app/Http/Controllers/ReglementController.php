<?php

namespace App\Http\Controllers;

use App\Models\Reglement;
use App\Models\Tier;
use App\Models\ModeReglement;
use App\Models\StatutReglement;
use App\Models\CompteBancaire;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Exception;

class ReglementController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Reglement::with(['tier', 'modeReglement', 'statutReglement', 'compteBancaire'])
            ->orderBy('date_reglement', 'desc')
            ->orderBy('created_at', 'desc');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('ref', 'like', "%{$search}%")
                  ->orWhere('numero_transaction', 'like', "%{$search}%")
                  ->orWhere('emetteur', 'like', "%{$search}%")
                  ->orWhereHas('tier', function ($tQ) use ($search) {
                      $tQ->where('label', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }

        if ($request->filled('statut_reglement_id')) {
            $query->where('statut_reglement_id', $request->input('statut_reglement_id'));
        }

        if ($request->filled('sense')) {
            $query->where('sense', $request->input('sense'));
        }

        $reglements = $query->paginate(10)->withQueryString();

        return Inertia::render('Reglement/Index', [
            'reglements' => $reglements,
            'statuts' => StatutReglement::orderBy('label')->get(),
            'filters' => $request->only('search', 'type', 'statut_reglement_id', 'sense'),
        ]);
    }

    public function create(Request $request): Response
    {
        $tiers = Tier::where('status', 'actif')
            ->orderBy('label')
            ->get();

        $modes = ModeReglement::orderBy('label')->get();
        $comptes = CompteBancaire::orderBy('label')->get();
        $statuts = StatutReglement::orderBy('label')->get();

        $origin = null;
        if ($request->filled('origin_type') && $request->filled('origin_id')) {
            $originClass = $request->input('origin_type');
            if (class_exists($originClass)) {
                $origin = $originClass::find($request->input('origin_id'));
            }
        }

        return Inertia::render('Reglement/Create', [
            'tiers' => $tiers,
            'modes' => $modes,
            'comptes' => $comptes,
            'statuts' => $statuts,
            'origin' => $origin,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'type' => ['required', 'string', 'in:vente,achat'],
            'tier_id' => ['required', 'exists:tiers,id'],
            'date_saisie' => ['required', 'date'],
            'date_reglement' => ['required', 'date'],
            'montant_ttc' => ['required', 'numeric', 'min:0.0001'],
            'mode_reglement_id' => ['required', 'exists:modes_reglement,id'],
            'statut_reglement_id' => ['required', 'exists:statuts_reglement,id'],
            'compte_bancaire_id' => [
                function ($attribute, $value, $fail) use ($request) {
                    $statut = StatutReglement::find($request->input('statut_reglement_id'));
                    if ($statut && $statut->is_banque && empty($value)) {
                        $fail('Le champ Banque à Créditer/Débiter est obligatoire pour ce statut.');
                    }
                },
                'nullable',
                'exists:comptes_bancaires,id'
            ],
            'numero_transaction' => ['nullable', 'string', 'max:100'],
            'emetteur' => ['nullable', 'string', 'max:150'],
            'banque_cheque' => ['nullable', 'string', 'max:150'],
            'commentaire' => ['nullable', 'string'],
            'origin_type' => ['nullable', 'string'],
            'origin_id' => ['nullable', 'integer'],
            'sense' => [
                'required',
                'string',
                'in:d,c',
                function ($attribute, $value, $fail) use ($request) {
                    $originType = $request->input('origin_type');
                    if ($originType === 'App\\Models\\AvoirVente') {
                        $expected = 'c';
                    } elseif ($originType === 'App\\Models\\AvoirAchat') {
                        $expected = 'd';
                    } else {
                        $expected = $request->input('type') === 'vente' ? 'd' : 'c';
                    }
                    if ($value !== $expected) {
                        $fail('Le sens comptable n\'est pas correct pour le type de document.');
                    }
                }
            ],
        ]);

        $originType = $request->input('origin_type');
        $originId = $request->input('origin_id');
        if ($originType && $originId && in_array($originType, ['App\\Models\\FactureVente', 'App\\Models\\FactureAchat', 'App\\Models\\AvoirVente', 'App\\Models\\AvoirAchat'])) {
            $document = $originType::find($originId);
            if ($document) {
                $query = Reglement::where('origin_type', $originType)
                    ->where('origin_id', $originId);
                $alreadyPaid = (double)$query->sum('montant_ttc');
                $remaining = (double)$document->total_ttc - $alreadyPaid;
                
                if ($remaining < 0) {
                    $remaining = 0.0;
                }

                if (round((double)$request->input('montant_ttc'), 4) > round($remaining, 4)) {
                    return back()->withErrors([
                        'montant_ttc' => "Le montant du règlement (" . number_format($request->input('montant_ttc'), 2) . ") dépasse le montant restant à payer de ce document (" . number_format($remaining, 2) . ")."
                    ])->withInput();
                }
            }
        }

        try {
            $type = $request->input('type');
            $date = date('Ym', strtotime($request->input('date_reglement')));
            
            $count = Reglement::whereYear('date_reglement', date('Y', strtotime($request->input('date_reglement'))))
                ->whereMonth('date_reglement', date('m', strtotime($request->input('date_reglement'))))
                ->count();
            
            $nextNum = str_pad($count + 1, 4, '0', STR_PAD_LEFT);
            $refPrefix = ($type === 'vente') ? 'RGV' : 'RGA';
            $ref = "{$refPrefix}-{$date}-{$nextNum}";

            Reglement::create([
                'ref' => $ref,
                'type' => $type,
                'tier_id' => $request->input('tier_id'),
                'date_saisie' => $request->input('date_saisie'),
                'date_reglement' => $request->input('date_reglement'),
                'montant_ttc' => $request->input('montant_ttc'),
                'mode_reglement_id' => $request->input('mode_reglement_id'),
                'statut_reglement_id' => $request->input('statut_reglement_id'),
                'compte_bancaire_id' => $request->input('compte_bancaire_id'),
                'numero_transaction' => $request->input('numero_transaction'),
                'emetteur' => $request->input('emetteur'),
                'banque_cheque' => $request->input('banque_cheque'),
                'commentaire' => $request->input('commentaire'),
                'sense' => $request->input('sense'),
                'origin_type' => $request->input('origin_type'),
                'origin_id' => $request->input('origin_id'),
            ]);

            return redirect()->route('reglements.index')->with('success', 'Règlement créé avec succès.');
        } catch (Exception $e) {
            return back()->with('error', $e->getMessage())->withInput();
        }
    }

    public function edit(Reglement $reglement): Response
    {
        $reglement->load('origin');

        $tiers = Tier::where('status', 'actif')
            ->orderBy('label')
            ->get();

        $modes = ModeReglement::orderBy('label')->get();
        $comptes = CompteBancaire::orderBy('label')->get();
        $statuts = StatutReglement::orderBy('label')->get();

        return Inertia::render('Reglement/Edit', [
            'reglement' => $reglement,
            'tiers' => $tiers,
            'modes' => $modes,
            'comptes' => $comptes,
            'statuts' => $statuts,
        ]);
    }

    public function update(Request $request, Reglement $reglement): RedirectResponse
    {
        $request->validate([
            'type' => ['required', 'string', 'in:vente,achat'],
            'tier_id' => ['required', 'exists:tiers,id'],
            'date_saisie' => ['required', 'date'],
            'date_reglement' => ['required', 'date'],
            'montant_ttc' => ['required', 'numeric', 'min:0.0001'],
            'mode_reglement_id' => ['required', 'exists:modes_reglement,id'],
            'statut_reglement_id' => ['required', 'exists:statuts_reglement,id'],
            'compte_bancaire_id' => [
                function ($attribute, $value, $fail) use ($request) {
                    $statut = StatutReglement::find($request->input('statut_reglement_id'));
                    if ($statut && $statut->is_banque && empty($value)) {
                        $fail('Le champ Banque à Créditer/Débiter est obligatoire pour ce statut.');
                    }
                },
                'nullable',
                'exists:comptes_bancaires,id'
            ],
            'numero_transaction' => ['nullable', 'string', 'max:100'],
            'emetteur' => ['nullable', 'string', 'max:150'],
            'banque_cheque' => ['nullable', 'string', 'max:150'],
            'commentaire' => ['nullable', 'string'],
            'origin_type' => ['nullable', 'string'],
            'origin_id' => ['nullable', 'integer'],
            'sense' => [
                'required',
                'string',
                'in:d,c',
                function ($attribute, $value, $fail) use ($request) {
                    $originType = $request->input('origin_type');
                    if ($originType === 'App\\Models\\AvoirVente') {
                        $expected = 'c';
                    } elseif ($originType === 'App\\Models\\AvoirAchat') {
                        $expected = 'd';
                    } else {
                        $expected = $request->input('type') === 'vente' ? 'd' : 'c';
                    }
                    if ($value !== $expected) {
                        $fail('Le sens comptable n\'est pas correct pour le type de document.');
                    }
                }
            ],
        ]);

        $originType = $request->input('origin_type');
        $originId = $request->input('origin_id');
        if ($originType && $originId && in_array($originType, ['App\\Models\\FactureVente', 'App\\Models\\FactureAchat', 'App\\Models\\AvoirVente', 'App\\Models\\AvoirAchat'])) {
            $document = $originType::find($originId);
            if ($document) {
                $query = Reglement::where('origin_type', $originType)
                    ->where('origin_id', $originId)
                    ->where('id', '!=', $reglement->id);
                $alreadyPaid = (double)$query->sum('montant_ttc');
                $remaining = (double)$document->total_ttc - $alreadyPaid;
                
                if ($remaining < 0) {
                    $remaining = 0.0;
                }

                if (round((double)$request->input('montant_ttc'), 4) > round($remaining, 4)) {
                    return back()->withErrors([
                        'montant_ttc' => "Le montant du règlement (" . number_format($request->input('montant_ttc'), 2) . ") dépasse le montant restant à payer de ce document (" . number_format($remaining, 2) . ")."
                    ])->withInput();
                }
            }
        }

        try {
            $reglement->update([
                'type' => $request->input('type'),
                'tier_id' => $request->input('tier_id'),
                'date_saisie' => $request->input('date_saisie'),
                'date_reglement' => $request->input('date_reglement'),
                'montant_ttc' => $request->input('montant_ttc'),
                'mode_reglement_id' => $request->input('mode_reglement_id'),
                'statut_reglement_id' => $request->input('statut_reglement_id'),
                'compte_bancaire_id' => $request->input('compte_bancaire_id'),
                'numero_transaction' => $request->input('numero_transaction'),
                'emetteur' => $request->input('emetteur'),
                'banque_cheque' => $request->input('banque_cheque'),
                'commentaire' => $request->input('commentaire'),
                'sense' => $request->input('sense'),
                'origin_type' => $request->input('origin_type'),
                'origin_id' => $request->input('origin_id'),
            ]);

            return redirect()->route('reglements.index')->with('success', 'Règlement mis à jour avec succès.');
        } catch (Exception $e) {
            return back()->with('error', $e->getMessage())->withInput();
        }
    }

    public function destroy(Reglement $reglement): RedirectResponse
    {
        try {
            $reglement->delete();
            return redirect()->route('reglements.index')->with('success', 'Règlement supprimé avec succès.');
        } catch (Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }
}
