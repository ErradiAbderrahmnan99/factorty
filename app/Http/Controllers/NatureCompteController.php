<?php

namespace App\Http\Controllers;

use App\Models\NatureCompte;
use App\Models\NatureCompteFourchette;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NatureCompteController extends Controller
{
    public function index()
    {
        $natures = NatureCompte::with('fourchettes')->get();
        return Inertia::render('NatureCompte/Index', [
            'natures' => $natures
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'label' => 'required|string|unique:nature_comptes,label'
        ]);

        NatureCompte::create($request->only('label'));
        return back()->with('success', 'Nature de compte ajoutée.');
    }

    public function destroy(NatureCompte $nature_compte)
    {
        $nature_compte->delete();
        return back()->with('success', 'Nature de compte supprimée.');
    }

    public function storeFourchette(Request $request, NatureCompte $nature_compte)
    {
        $request->validate([
            'debut' => 'required|string',
            'fin' => 'required|string',
        ]);

        $nature_compte->fourchettes()->create($request->only('debut', 'fin'));
        return back()->with('success', 'Fourchette ajoutée.');
    }

    public function destroyFourchette(NatureCompteFourchette $fourchette)
    {
        $fourchette->delete();
        return back()->with('success', 'Fourchette supprimée.');
    }
}
