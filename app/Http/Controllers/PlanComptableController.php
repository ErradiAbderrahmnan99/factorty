<?php

namespace App\Http\Controllers;

use App\Models\PlanComptable;
use App\Models\ClasseComptable;
use App\Models\Tier;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect;

class PlanComptableController extends Controller
{
    public function index(Request $request)
    {
        $query = PlanComptable::with(['classe', 'parent', 'tier']);

        if ($request->has('search') && $request->search != '') {
            $query->where('numero', 'like', '%' . $request->search . '%')
                  ->orWhere('libelle', 'like', '%' . $request->search . '%');
        }

        $comptes = $query->orderBy('numero', 'asc')->paginate(10)->withQueryString();

        return Inertia::render('PlanComptable/Index', [
            'comptes' => $comptes,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create()
    {
        $classes = ClasseComptable::orderBy('numero')->get();
        $parents = PlanComptable::orderBy('numero')->get();
        $tiers = Tier::orderBy('label')->get();

        return Inertia::render('PlanComptable/Create', [
            'classes' => $classes,
            'parents' => $parents,
            'tiers' => $tiers,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'numero' => 'required|string|unique:plan_comptables,numero',
            'libelle' => 'required|string',
            'classe_id' => 'required|exists:classe_comptables,id',
            'parent_id' => 'nullable|exists:plan_comptables,id',
            'sens' => 'required|in:debit,credit,mixte',
            'collectif' => 'boolean',
            'tier_id' => 'nullable|required_if:collectif,true|exists:tiers,id',
            'actif' => 'boolean',
        ]);

        PlanComptable::create($request->all());

        return Redirect::route('plan-comptable.index')->with('success', 'Compte créé avec succès.');
    }

    public function edit(PlanComptable $plan_comptable)
    {
        $classes = ClasseComptable::orderBy('numero')->get();
        $parents = PlanComptable::where('id', '!=', $plan_comptable->id)->orderBy('numero')->get();
        $tiers = Tier::orderBy('label')->get();

        return Inertia::render('PlanComptable/Edit', [
            'compte' => $plan_comptable,
            'classes' => $classes,
            'parents' => $parents,
            'tiers' => $tiers,
        ]);
    }

    public function update(Request $request, PlanComptable $plan_comptable)
    {
        $request->validate([
            'numero' => 'required|string|unique:plan_comptables,numero,' . $plan_comptable->id,
            'libelle' => 'required|string',
            'classe_id' => 'required|exists:classe_comptables,id',
            'parent_id' => 'nullable|exists:plan_comptables,id',
            'sens' => 'required|in:debit,credit,mixte',
            'collectif' => 'boolean',
            'tier_id' => 'nullable|required_if:collectif,true|exists:tiers,id',
            'actif' => 'boolean',
        ]);

        $plan_comptable->update($request->all());

        return Redirect::route('plan-comptable.index')->with('success', 'Compte mis à jour avec succès.');
    }

    public function destroy(PlanComptable $plan_comptable)
    {
        $plan_comptable->delete();
        return Redirect::route('plan-comptable.index')->with('success', 'Compte supprimé avec succès.');
    }
}
