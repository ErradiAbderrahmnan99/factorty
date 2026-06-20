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
            $rawEcritures = \App\Models\EcritureComptable::select('ecriture_comptables.*')
                ->join('pieces_comptables', 'pieces_comptables.id', '=', 'ecriture_comptables.piece_comptable_id')
                ->with(['planComptable', 'compteTier', 'piece'])
                ->where('pieces_comptables.journal_comptable_id', $journal_id)
                ->where('pieces_comptables.exercice_comptable_id', $exercice_id)
                ->where('pieces_comptables.periode_comptable_id', $periode_id)
                ->orderBy('pieces_comptables.jour')
                ->orderBy('pieces_comptables.id')
                ->orderBy('ecriture_comptables.id')
                ->get();

            // Map the header attributes onto the lines so the frontend gets the same structure
            $ecritures = $rawEcritures->map(function ($item) {
                $item->jour = $item->piece->jour;
                $item->numero_piece = $item->piece->numero_piece;
                $item->numero_facture = $item->piece->numero_facture;
                return $item;
            });
        }

        return \Inertia\Inertia::render('SaisieEcriture/Index', [
            'journaux' => \App\Models\JournalComptable::with(['natureCompte', 'compteContrepartie'])->orderBy('code')->get(),
            'exercices' => \App\Models\ExerciceComptable::with('periodes')->orderBy('date_debut', 'desc')->get(),
            'comptes_generaux' => \App\Models\PlanComptable::where('actif', true)->where('collectif', false)->orderBy('numero')->get(),
            'comptes_tiers' => \App\Models\PlanComptable::where('actif', true)->where('collectif', true)->orderBy('numero')->get(),
            'taux_tva' => \App\Models\TauxTva::where('actif', true)->get(),
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
            'numero_piece' => 'required|string|unique:pieces_comptables,numero_piece',
            'numero_facture' => 'nullable|string|unique:pieces_comptables,numero_facture',
            'lignes' => 'required|array|min:2',
            'lignes.*.plan_comptable_id' => 'required|exists:plan_comptables,id',
            'lignes.*.compte_tier_id' => 'nullable|exists:plan_comptables,id',
            'lignes.*.libelle' => 'required|string',
            'lignes.*.date_echeance' => 'nullable|date',
            'lignes.*.debit' => 'required|numeric|min:0',
            'lignes.*.credit' => 'required|numeric|min:0',
        ]);

        // Validate unique combination of general and tier account within the piece
        $seen = [];
        foreach ($validated['lignes'] as $ligne) {
            $planComptableId = $ligne['plan_comptable_id'];
            $compteTierId = $ligne['compte_tier_id'] ?? null;
            $key = $planComptableId . '-' . ($compteTierId ?? 'null');
            if (in_array($key, $seen)) {
                return back()->withErrors(['lignes' => 'Chaque ligne de la pièce doit avoir une combinaison unique de Compte général et Compte tiers.']);
            }
            $seen[] = $key;
        }

        $totalDebit = collect($validated['lignes'])->sum('debit');
        $totalCredit = collect($validated['lignes'])->sum('credit');

        if (abs($totalDebit - $totalCredit) > 0.01) {
            return back()->withErrors(['lignes' => 'La pièce comptable doit être équilibrée (Total Débit = Total Crédit).']);
        }

        \DB::transaction(function () use ($validated) {
            // Create the PieceComptable header
            $piece = \App\Models\PieceComptable::create([
                'journal_comptable_id' => $validated['journal_comptable_id'],
                'exercice_comptable_id' => $validated['exercice_comptable_id'],
                'periode_comptable_id' => $validated['periode_comptable_id'],
                'jour' => $validated['jour'],
                'numero_piece' => $validated['numero_piece'],
                'numero_facture' => isset($validated['numero_facture']) && trim($validated['numero_facture']) !== '' ? $validated['numero_facture'] : null,
            ]);

            // Create the child lines
            foreach ($validated['lignes'] as $ligne) {
                \App\Models\EcritureComptable::create([
                    'piece_comptable_id' => $piece->id,
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
        $piece = $ecriture->piece;
        $ecriture->delete();

        // If the piece has no lines left, delete it as well
        if ($piece && $piece->lignes()->count() === 0) {
            $piece->delete();
        }

        return redirect()->back()->with('success', 'Ligne supprimée avec succès.');
    }
}
