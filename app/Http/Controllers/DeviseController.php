<?php

namespace App\Http\Controllers;

use App\Models\Devise;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class DeviseController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Devise/Index', [
            'devises' => Devise::orderBy('label')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'code'   => ['required', 'string', 'max:10', 'unique:devises,code'],
            'label'  => ['required', 'string', 'max:255'],
            'symbol' => ['nullable', 'string', 'max:10'],
        ]);

        Devise::create($request->only('code', 'label', 'symbol'));

        return back()->with('success', 'Devise créée avec succès.');
    }

    public function update(Request $request, Devise $devise): RedirectResponse
    {
        $request->validate([
            'code'   => ['required', 'string', 'max:10', "unique:devises,code,{$devise->id}"],
            'label'  => ['required', 'string', 'max:255'],
            'symbol' => ['nullable', 'string', 'max:10'],
        ]);

        $devise->update($request->only('code', 'label', 'symbol'));

        return back()->with('success', 'Devise mise à jour.');
    }

    public function destroy(Devise $devise): RedirectResponse
    {
        $devise->delete();
        return back()->with('success', 'Devise supprimée.');
    }
}
