<?php
namespace App\Http\Controllers;
use App\Models\TypeApporteur;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class TypeApporteurController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('TypeApporteur/Index', [
            'items' => TypeApporteur::orderBy('label')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate(['label' => ['required','string','max:150','unique:type_apporteur,label']]);
        TypeApporteur::create($request->only('label'));
        return back()->with('success', 'Enregistré avec succès.');
    }

    public function update(Request $request, TypeApporteur $item): RedirectResponse
    {
        $request->validate(['label' => ['required','string','max:150',"unique:type_apporteur,label,{$item->id}"]]);
        $item->update($request->only('label'));
        return back()->with('success', 'Mis à jour.');
    }

    public function destroy(TypeApporteur $item): RedirectResponse
    {
        $item->delete();
        return back()->with('success', 'Supprimé.');
    }
}
