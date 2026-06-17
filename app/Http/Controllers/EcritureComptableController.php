<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class EcritureComptableController extends Controller
{
    public function index(Request $request)
    {
        $journal_id = $request->input('journal_id');
        $exercice_id = $request->input('exercice_id');
        $periode_id = $request->input('periode_id');

        $ecritures = [];
        if ($journal_id && $exercice_id && $periode_id) {
            $ecritures = \App\Models\EcritureComptable::with(['planComptable', 'compteTier'])
                ->where('journal_comptable_id', $journal_id)
                ->where('exercice_comptable_id', $exercice_id)
                ->where('periode_comptable_id', $periode_id)
                ->orderBy('jour')
                ->orderBy('id')
                ->get();
        }

        return \Inertia\Inertia::render('SaisieEcriture/Index', [
            'journaux' => \App\Models\JournalComptable::orderBy('code')->get(),
            'exercices' => \App\Models\ExerciceComptable::with('periodes')->orderBy('date_debut', 'desc')->get(),
            'comptes_generaux' => \App\Models\PlanComptable::where('actif', true)->where('collectif', false)->orderBy('numero')->get(),
            'comptes_tiers' => \App\Models\PlanComptable::where('actif', true)->where('collectif', true)->orderBy('numero')->get(),
            'ecritures' => $ecritures,
            'filters' => [
                'journal_id' => $journal_id,
                'exercice_id' => $exercice_id,
                'periode_id' => $periode_id,
            ]
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'journal_comptable_id' => 'required|exists:journal_comptables,id',
            'exercice_comptable_id' => 'required|exists:exercice_comptables,id',
            'periode_comptable_id' => 'required|exists:periode_comptables,id',
            'jour' => 'required|integer|min:1|max:31',
            'numero_piece' => 'required|string',
            'numero_facture' => 'nullable|string',
            'lignes' => 'required|array|min:2',
            'lignes.*.plan_comptable_id' => 'required|exists:plan_comptables,id',
            'lignes.*.compte_tier_id' => 'nullable|exists:plan_comptables,id',
            'lignes.*.libelle' => 'required|string',
            'lignes.*.date_echeance' => 'nullable|date',
            'lignes.*.debit' => 'required|numeric|min:0',
            'lignes.*.credit' => 'required|numeric|min:0',
        ]);

        $totalDebit = collect($validated['lignes'])->sum('debit');
        $totalCredit = collect($validated['lignes'])->sum('credit');

        if (abs($totalDebit - $totalCredit) > 0.01) {
            return back()->withErrors(['lignes' => 'La pièce comptable doit être équilibrée (Total Débit = Total Crédit).']);
        }

        \DB::transaction(function () use ($validated) {
            foreach ($validated['lignes'] as $ligne) {
                \App\Models\EcritureComptable::create([
                    'journal_comptable_id' => $validated['journal_comptable_id'],
                    'exercice_comptable_id' => $validated['exercice_comptable_id'],
                    'periode_comptable_id' => $validated['periode_comptable_id'],
                    'jour' => $validated['jour'],
                    'numero_piece' => $validated['numero_piece'],
                    'numero_facture' => $validated['numero_facture'],
                    'plan_comptable_id' => $ligne['plan_comptable_id'],
                    'compte_tier_id' => $ligne['compte_tier_id'] ?? null,
                    'libelle' => $ligne['libelle'],
                    'date_echeance' => $ligne['date_echeance'] ?? null,
                    'debit' => $ligne['debit'],
                    'credit' => $ligne['credit'],
                ]);
            }
        });

        return redirect()->back()->with('success', 'Pièce comptable enregistrée avec succès.');
    }

    public function destroy(\App\Models\EcritureComptable $ecriture)
    {
        $ecriture->delete();
        return redirect()->back()->with('success', 'Ligne supprimée avec succès.');
    }
}
