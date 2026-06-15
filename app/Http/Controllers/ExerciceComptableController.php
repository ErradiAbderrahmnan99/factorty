<?php

namespace App\Http\Controllers;

use App\Models\ExerciceComptable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect;

class ExerciceComptableController extends Controller
{
    public function index(Request $request)
    {
        $query = ExerciceComptable::query();

        if ($request->has('search') && $request->search != '') {
            $query->where('code', 'like', '%' . $request->search . '%')
                  ->orWhere('libelle', 'like', '%' . $request->search . '%');
        }

        $exercices = $query->orderBy('date_debut', 'desc')->paginate(10)->withQueryString();

        return Inertia::render('ExercicesComptables/Index', [
            'exercices' => $exercices,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create()
    {
        return Inertia::render('ExercicesComptables/Create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'code' => 'required|string|unique:exercice_comptables,code',
            'libelle' => 'required|string',
            'date_debut' => 'required|date',
            'date_fin' => 'required|date|after:date_debut',
            'statut' => 'required|in:ouvert,cloture,provisoire',
        ]);

        ExerciceComptable::create($request->all());

        return Redirect::route('exercices-comptables.index')->with('success', 'Exercice comptable créé avec succès.');
    }

    public function edit(ExerciceComptable $exercices_comptable)
    {
        return Inertia::render('ExercicesComptables/Edit', [
            'exercice' => $exercices_comptable,
        ]);
    }

    public function update(Request $request, ExerciceComptable $exercices_comptable)
    {
        $request->validate([
            'code' => 'required|string|unique:exercice_comptables,code,' . $exercices_comptable->id,
            'libelle' => 'required|string',
            'date_debut' => 'required|date',
            'date_fin' => 'required|date|after:date_debut',
            'statut' => 'required|in:ouvert,cloture,provisoire',
        ]);

        $exercices_comptable->update($request->all());

        return Redirect::route('exercices-comptables.index')->with('success', 'Exercice comptable mis à jour avec succès.');
    }

    public function destroy(ExerciceComptable $exercices_comptable)
    {
        $exercices_comptable->delete();

        return Redirect::route('exercices-comptables.index')->with('success', 'Exercice comptable supprimé avec succès.');
    }
}
