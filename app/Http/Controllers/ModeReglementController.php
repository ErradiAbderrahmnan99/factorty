<?php
namespace App\Http\Controllers;
use App\Models\ModeReglement;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ModeReglementController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('ModeReglement/Index', [
            'items' => ModeReglement::orderBy('label')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate(['label' => ['required','string','max:150','unique:mode_reglement,label']]);
        ModeReglement::create($request->only('label'));
        return back()->with('success', 'Enregistré avec succès.');
    }

    public function update(Request $request, ModeReglement $item): RedirectResponse
    {
        $request->validate(['label' => ['required','string','max:150',"unique:mode_reglement,label,{$item->id}"]]);
        $item->update($request->only('label'));
        return back()->with('success', 'Mis à jour.');
    }

    public function destroy(ModeReglement $item): RedirectResponse
    {
        $item->delete();
        return back()->with('success', 'Supprimé.');
    }
}
