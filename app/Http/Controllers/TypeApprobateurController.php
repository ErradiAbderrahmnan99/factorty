<?php
namespace App\Http\Controllers;
use App\Models\TypeApprobateur;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class TypeApprobateurController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('TypeApprobateur/Index', [
            'items' => TypeApprobateur::orderBy('label')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate(['label' => ['required','string','max:150','unique:types_approbateur,label']]);
        TypeApprobateur::create($request->only('label'));
        return back()->with('success', 'Enregistré avec succès.');
    }

    public function update(Request $request, TypeApprobateur $item): RedirectResponse
    {
        $request->validate(['label' => ['required','string','max:150',"unique:types_approbateur,label,{$item->id}"]]);
        $item->update($request->only('label'));
        return back()->with('success', 'Mis à jour.');
    }

    public function destroy(TypeApprobateur $item): RedirectResponse
    {
        $item->delete();
        return back()->with('success', 'Supprimé.');
    }
}
