<?php
namespace App\Http\Controllers;
use App\Models\ConditionReglement;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ConditionReglementController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('ConditionReglement/Index', [
            'items' => ConditionReglement::orderBy('label')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate(['label' => ['required','string','max:150','unique:condition_reglement,label']]);
        ConditionReglement::create($request->only('label'));
        return back()->with('success', 'Enregistré avec succès.');
    }

    public function update(Request $request, ConditionReglement $item): RedirectResponse
    {
        $request->validate(['label' => ['required','string','max:150',"unique:condition_reglement,label,{$item->id}"]]);
        $item->update($request->only('label'));
        return back()->with('success', 'Mis à jour.');
    }

    public function destroy(ConditionReglement $item): RedirectResponse
    {
        $item->delete();
        return back()->with('success', 'Supprimé.');
    }
}
