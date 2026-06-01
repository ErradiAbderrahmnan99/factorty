<?php
namespace App\Http\Controllers;

use App\Models\Apporteur;
use App\Models\TypeApporteur;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ApporteurController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Apporteur/Index', [
            'items' => Apporteur::with('typeApporteur')->orderBy('label')->get(),
            'typesApporteur' => TypeApporteur::orderBy('label')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'label' => ['required', 'string', 'max:150'],
            'type_apporteur_id' => ['nullable', 'exists:types_apporteur,id'],
            'telephone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:150'],
        ]);

        Apporteur::create($request->only('label', 'type_apporteur_id', 'telephone', 'email'));
        return back()->with('success', 'Apporteur enregistré avec succès.');
    }

    public function update(Request $request, Apporteur $item): RedirectResponse
    {
        $request->validate([
            'label' => ['required', 'string', 'max:150'],
            'type_apporteur_id' => ['nullable', 'exists:types_apporteur,id'],
            'telephone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:150'],
        ]);

        $item->update($request->only('label', 'type_apporteur_id', 'telephone', 'email'));
        return back()->with('success', 'Apporteur mis à jour.');
    }

    public function destroy(Apporteur $item): RedirectResponse
    {
        $item->delete();
        return back()->with('success', 'Apporteur supprimé.');
    }
}
