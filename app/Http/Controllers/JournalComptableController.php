<?php

namespace App\Http\Controllers;

use App\Models\JournalComptable;
use App\Models\PlanComptable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect;

class JournalComptableController extends Controller
{
    public function index(Request $request)
    {
        $query = JournalComptable::with(['compteContrepartie', 'natureCompte']);

        if ($request->has('search') && $request->search != '') {
            $query->where('code', 'like', '%' . $request->search . '%')
                  ->orWhere('libelle', 'like', '%' . $request->search . '%');
        }

        $journaux = $query->orderBy('code', 'asc')->paginate(10)->withQueryString();

        return Inertia::render('JournauxComptables/Index', [
            'journaux' => $journaux,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create()
    {
        return Inertia::render('JournauxComptables/Create', [
            'comptes' => PlanComptable::where('actif', true)->orderBy('numero')->get(),
            'natures_comptes' => \App\Models\NatureCompte::all(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'code' => 'required|string|unique:journal_comptables,code',
            'libelle' => 'required|string',
            'nature_compte_id' => 'required|exists:nature_comptes,id',
            'compte_contrepartie_id' => 'nullable|exists:plan_comptables,id',
        ]);

        JournalComptable::create($request->all());

        return Redirect::route('journaux-comptables.index')->with('success', 'Journal comptable créé avec succès.');
    }

    public function edit(JournalComptable $journaux_comptable)
    {
        return Inertia::render('JournauxComptables/Edit', [
            'journal' => $journaux_comptable,
            'comptes' => PlanComptable::where('actif', true)->orderBy('numero')->get(),
            'natures_comptes' => \App\Models\NatureCompte::all(),
        ]);
    }

    public function update(Request $request, JournalComptable $journaux_comptable)
    {
        $request->validate([
            'code' => 'required|string|unique:journal_comptables,code,' . $journaux_comptable->id,
            'libelle' => 'required|string',
            'nature_compte_id' => 'required|exists:nature_comptes,id',
            'compte_contrepartie_id' => 'nullable|exists:plan_comptables,id',
        ]);

        $journaux_comptable->update($request->all());

        return Redirect::route('journaux-comptables.index')->with('success', 'Journal comptable mis à jour avec succès.');
    }

    public function destroy(JournalComptable $journaux_comptable)
    {
        $journaux_comptable->delete();
        return Redirect::route('journaux-comptables.index')->with('success', 'Journal comptable supprimé avec succès.');
    }
}
