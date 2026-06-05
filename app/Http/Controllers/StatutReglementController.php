<?php

namespace App\Http\Controllers;

use App\Models\ModeReglement;
use App\Models\StatutReglement;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class StatutReglementController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('StatutReglement/Index', [
            'items' => StatutReglement::with('modeReglement')->orderBy('label')->get(),
            'modes' => ModeReglement::orderBy('label')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'label' => [
                'required',
                'string',
                'max:150',
                Rule::unique('statuts_reglement', 'label')->where(function ($query) use ($request) {
                    return $query->where('mode_reglement_id', $request->mode_reglement_id);
                }),
            ],
            'mode_reglement_id' => ['required', 'exists:modes_reglement,id'],
            'is_banque' => ['required', 'boolean'],
        ]);

        StatutReglement::create($validated);

        return back()->with('success', 'Statut de règlement enregistré avec succès.');
    }

    public function update(Request $request, StatutReglement $statuts_reglement): RedirectResponse
    {
        $validated = $request->validate([
            'label' => [
                'required',
                'string',
                'max:150',
                Rule::unique('statuts_reglement', 'label')
                    ->where(function ($query) use ($request) {
                        return $query->where('mode_reglement_id', $request->mode_reglement_id);
                    })
                    ->ignore($statuts_reglement->id),
            ],
            'mode_reglement_id' => ['required', 'exists:modes_reglement,id'],
            'is_banque' => ['required', 'boolean'],
        ]);

        $statuts_reglement->update($validated);

        return back()->with('success', 'Statut de règlement mis à jour avec succès.');
    }

    public function destroy(StatutReglement $statuts_reglement): RedirectResponse
    {
        $statuts_reglement->delete();
        return back()->with('success', 'Statut de règlement supprimé.');
    }
}
