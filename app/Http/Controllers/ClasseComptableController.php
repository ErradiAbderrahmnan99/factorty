<?php

namespace App\Http\Controllers;

use App\Models\ClasseComptable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect;

class ClasseComptableController extends Controller
{
    public function index(Request $request)
    {
        $query = ClasseComptable::query();

        if ($request->has('search') && $request->search != '') {
            $query->where('numero', 'like', '%' . $request->search . '%')
                  ->orWhere('libelle', 'like', '%' . $request->search . '%')
                  ->orWhere('nature', 'like', '%' . $request->search . '%');
        }

        $classes = $query->orderBy('numero', 'asc')->paginate(10)->withQueryString();

        return Inertia::render('ClassesComptables/Index', [
            'classes' => $classes,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create()
    {
        return Inertia::render('ClassesComptables/Create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'numero' => 'required|string|unique:classe_comptables,numero',
            'libelle' => 'required|string',
            'nature' => 'nullable|string',
        ]);

        ClasseComptable::create($request->all());

        return Redirect::route('classes-comptables.index')->with('success', 'Classe comptable créée avec succès.');
    }

    public function edit(ClasseComptable $classes_comptable)
    {
        return Inertia::render('ClassesComptables/Edit', [
            'classe' => $classes_comptable,
        ]);
    }

    public function update(Request $request, ClasseComptable $classes_comptable)
    {
        $request->validate([
            'numero' => 'required|string|unique:classe_comptables,numero,' . $classes_comptable->id,
            'libelle' => 'required|string',
            'nature' => 'nullable|string',
        ]);

        $classes_comptable->update($request->all());

        return Redirect::route('classes-comptables.index')->with('success', 'Classe comptable mise à jour avec succès.');
    }

    public function destroy(ClasseComptable $classes_comptable)
    {
        $classes_comptable->delete();

        return Redirect::route('classes-comptables.index')->with('success', 'Classe comptable supprimée avec succès.');
    }
}
