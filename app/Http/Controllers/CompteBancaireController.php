<?php
namespace App\Http\Controllers;

use App\Models\CompteBancaire;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class CompteBancaireController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('CompteBancaire/Index', [
            'items' => CompteBancaire::orderBy('label')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'label' => ['required', 'string', 'max:150'],
            'banque' => ['nullable', 'string', 'max:150'],
            'rib' => ['nullable', 'string', 'max:50'],
            'iban' => ['nullable', 'string', 'max:50'],
            'swift' => ['nullable', 'string', 'max:20'],
        ]);

        CompteBancaire::create($request->only('label', 'banque', 'rib', 'iban', 'swift'));
        return back()->with('success', 'Compte bancaire enregistré avec succès.');
    }

    public function update(Request $request, CompteBancaire $item): RedirectResponse
    {
        $request->validate([
            'label' => ['required', 'string', 'max:150'],
            'banque' => ['nullable', 'string', 'max:150'],
            'rib' => ['nullable', 'string', 'max:50'],
            'iban' => ['nullable', 'string', 'max:50'],
            'swift' => ['nullable', 'string', 'max:20'],
        ]);

        $item->update($request->only('label', 'banque', 'rib', 'iban', 'swift'));
        return back()->with('success', 'Compte bancaire mis à jour.');
    }

    public function destroy(CompteBancaire $item): RedirectResponse
    {
        $item->delete();
        return back()->with('success', 'Compte bancaire supprimé.');
    }
}
