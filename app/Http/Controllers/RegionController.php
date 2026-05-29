<?php

namespace App\Http\Controllers;

use App\Models\Country;
use App\Models\Region;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class RegionController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Region/Index', [
            'regions'   => Region::with('country')->orderBy('label')->get(),
            'countries' => Country::orderBy('label')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'country_id' => ['required', 'exists:countries,id'],
            'code'       => ['required', 'string', 'max:20', 'unique:regions,code'],
            'label'      => ['required', 'string', 'max:255'],
        ]);
        Region::create($request->only('country_id', 'code', 'label'));
        return back()->with('success', 'Région créée avec succès.');
    }

    public function update(Request $request, Region $region): RedirectResponse
    {
        $request->validate([
            'country_id' => ['required', 'exists:countries,id'],
            'code'       => ['required', 'string', 'max:20', "unique:regions,code,{$region->id}"],
            'label'      => ['required', 'string', 'max:255'],
        ]);
        $region->update($request->only('country_id', 'code', 'label'));
        return back()->with('success', 'Région mise à jour.');
    }

    public function destroy(Region $region): RedirectResponse
    {
        $region->delete();
        return back()->with('success', 'Région supprimée.');
    }
}
