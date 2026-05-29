<?php

namespace App\Http\Controllers;

use App\Models\City;
use App\Models\Region;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class CityController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('City/Index', [
            'cities'  => City::with('region.country')->orderBy('label')->get(),
            'regions' => Region::with('country')->orderBy('label')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'region_id' => ['required', 'exists:regions,id'],
            'code'      => ['required', 'string', 'max:20', 'unique:cities,code'],
            'label'     => ['required', 'string', 'max:255'],
        ]);
        City::create($request->only('region_id', 'code', 'label'));
        return back()->with('success', 'Ville créée avec succès.');
    }

    public function update(Request $request, City $city): RedirectResponse
    {
        $request->validate([
            'region_id' => ['required', 'exists:regions,id'],
            'code'      => ['required', 'string', 'max:20', "unique:cities,code,{$city->id}"],
            'label'     => ['required', 'string', 'max:255'],
        ]);
        $city->update($request->only('region_id', 'code', 'label'));
        return back()->with('success', 'Ville mise à jour.');
    }

    public function destroy(City $city): RedirectResponse
    {
        $city->delete();
        return back()->with('success', 'Ville supprimée.');
    }
}
