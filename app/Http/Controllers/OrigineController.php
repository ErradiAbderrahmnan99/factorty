<?php
namespace App\Http\Controllers;
use App\Models\Origine;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class OrigineController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Origine/Index', [
            'items' => Origine::orderBy('label')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate(['label' => ['required','string','max:150','unique:origine,label']]);
        Origine::create($request->only('label'));
        return back()->with('success', 'Enregistré avec succès.');
    }

    public function update(Request $request, Origine $item): RedirectResponse
    {
        $request->validate(['label' => ['required','string','max:150',"unique:origine,label,{$item->id}"]]);
        $item->update($request->only('label'));
        return back()->with('success', 'Mis à jour.');
    }

    public function destroy(Origine $item): RedirectResponse
    {
        $item->delete();
        return back()->with('success', 'Supprimé.');
    }
}
