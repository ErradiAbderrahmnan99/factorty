<?php
namespace App\Http\Controllers;

use App\Models\CompteBancaire;
use App\Models\Devise;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class CompteBancaireController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('CompteBancaire/Index', [
            'items' => CompteBancaire::with(['devise'])->orderBy('label')->get(),
            'devises' => Devise::orderBy('code')->get(),
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
            'devise_id' => ['nullable', 'exists:devises,id'],
            'solde_min' => ['nullable', 'numeric'],
            'status' => ['required', 'string', 'in:ouvert,ferme'],
        ]);

        CompteBancaire::create($request->only('label', 'banque', 'rib', 'iban', 'swift', 'devise_id', 'solde_min', 'status'));
        return back()->with('success', 'Compte bancaire enregistré avec succès.');
    }

    public function update(Request $request, CompteBancaire $comptesBancaire): RedirectResponse
    {
        $request->validate([
            'label' => ['required', 'string', 'max:150'],
            'banque' => ['nullable', 'string', 'max:150'],
            'rib' => ['nullable', 'string', 'max:50'],
            'iban' => ['nullable', 'string', 'max:50'],
            'swift' => ['nullable', 'string', 'max:20'],
            'devise_id' => ['nullable', 'exists:devises,id'],
            'solde_min' => ['nullable', 'numeric'],
            'status' => ['required', 'string', 'in:ouvert,ferme'],
        ]);

        $comptesBancaire->update($request->only('label', 'banque', 'rib', 'iban', 'swift', 'devise_id', 'solde_min', 'status'));
        return back()->with('success', 'Compte bancaire mis à jour.');
    }

    public function ecritures(CompteBancaire $compte): Response
    {
        $compte->load(['devise']);
        $ecritures = $compte->ecritures()
            ->with(['origin'])
            ->orderBy('date_operation', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return Inertia::render('CompteBancaire/Ecritures', [
            'compte' => $compte,
            'ecritures' => $ecritures,
        ]);
    }

    public function destroy(CompteBancaire $comptesBancaire): RedirectResponse
    {
        $comptesBancaire->delete();
        return back()->with('success', 'Compte bancaire supprimé.');
    }
}
