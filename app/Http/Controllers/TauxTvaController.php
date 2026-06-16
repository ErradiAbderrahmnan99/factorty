<?php

namespace App\Http\Controllers;

use App\Models\TauxTva;
use App\Models\PlanComptable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect;

class TauxTvaController extends Controller
{
    public function index(Request $request)
    {
        $query = TauxTva::with(['compteTvaCollectee', 'compteTvaDeductibleBs', 'compteTvaDeductibleImmo']);

        if ($request->has('search') && $request->search != '') {
            $query->where('code', 'like', '%' . $request->search . '%')
                  ->orWhere('libelle', 'like', '%' . $request->search . '%');
        }

        $taux_tvas = $query->orderBy('code', 'asc')->paginate(10)->withQueryString();

        return Inertia::render('TauxTva/Index', [
            'taux_tvas' => $taux_tvas,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create()
    {
        $comptes = PlanComptable::orderBy('numero')->get();

        return Inertia::render('TauxTva/Create', [
            'comptes' => $comptes,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'code' => 'required|string|unique:taux_tvas,code',
            'libelle' => 'required|string',
            'taux' => 'required|numeric|min:0|max:100',
            'compte_tva_collectee_id' => 'nullable|exists:plan_comptables,id',
            'compte_tva_deductible_bs_id' => 'nullable|exists:plan_comptables,id',
            'compte_tva_deductible_immo_id' => 'nullable|exists:plan_comptables,id',
            'actif' => 'boolean',
        ]);

        TauxTva::create($request->all());

        return Redirect::route('taux-tva.index')->with('success', 'Taux de TVA créé avec succès.');
    }

    public function edit(TauxTva $taux_tva)
    {
        $comptes = PlanComptable::orderBy('numero')->get();

        return Inertia::render('TauxTva/Edit', [
            'taux_tva' => $taux_tva,
            'comptes' => $comptes,
        ]);
    }

    public function update(Request $request, TauxTva $taux_tva)
    {
        $request->validate([
            'code' => 'required|string|unique:taux_tvas,code,' . $taux_tva->id,
            'libelle' => 'required|string',
            'taux' => 'required|numeric|min:0|max:100',
            'compte_tva_collectee_id' => 'nullable|exists:plan_comptables,id',
            'compte_tva_deductible_bs_id' => 'nullable|exists:plan_comptables,id',
            'compte_tva_deductible_immo_id' => 'nullable|exists:plan_comptables,id',
            'actif' => 'boolean',
        ]);

        $taux_tva->update($request->all());

        return Redirect::route('taux-tva.index')->with('success', 'Taux de TVA mis à jour avec succès.');
    }

    public function destroy(TauxTva $taux_tva)
    {
        $taux_tva->delete();
        return Redirect::route('taux-tva.index')->with('success', 'Taux de TVA supprimé avec succès.');
    }
}
