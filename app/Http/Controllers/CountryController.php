<?php

namespace App\Http\Controllers;

use App\Models\Country;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class CountryController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Country/Index', [
            'countries' => Country::orderBy('label')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'code'  => ['required', 'string', 'max:10', 'unique:countries,code'],
            'label' => ['required', 'string', 'max:255'],
        ]);
        Country::create($request->only('code', 'label'));
        return back()->with('success', 'Pays créé avec succès.');
    }

    public function update(Request $request, Country $country): RedirectResponse
    {
        $request->validate([
            'code'  => ['required', 'string', 'max:10', "unique:countries,code,{$country->id}"],
            'label' => ['required', 'string', 'max:255'],
        ]);
        $country->update($request->only('code', 'label'));
        return back()->with('success', 'Pays mis à jour.');
    }

    public function destroy(Country $country): RedirectResponse
    {
        $country->delete();
        return back()->with('success', 'Pays supprimé.');
    }
}
