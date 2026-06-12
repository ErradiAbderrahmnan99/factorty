<?php

namespace App\Http\Controllers;

use App\Models\Branche;
use App\Models\Country;
use App\Models\Region;
use App\Models\City;
use App\Models\Entity;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class BrancheController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Branche/Index', [
            'branches'  => Branche::with(['country', 'region', 'city', 'entity'])->orderBy('name')->get(),
            'countries' => Country::orderBy('label')->get(),
            'regions'   => Region::orderBy('label')->get(),
            'cities'    => City::orderBy('label')->get(),
            'entities'  => Entity::orderBy('label')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'       => ['required', 'string', 'max:255'],
            'email'      => ['nullable', 'email', 'max:255'],
            'phone'      => ['nullable', 'string', 'max:30'],
            'country_id' => ['nullable', 'exists:countries,id'],
            'region_id'  => ['nullable', 'exists:regions,id'],
            'city_id'     => ['nullable', 'exists:cities,id'],
            'status'     => ['required', 'in:active,inactive'],
            'address'    => ['nullable', 'string', 'max:500'],
            'entity_id'  => ['nullable', 'exists:entities,id'],
        ]);

        if (empty($validated['entity_id'])) {
            $firstEntity = Entity::first();
            if ($firstEntity) {
                $validated['entity_id'] = $firstEntity->id;
            }
        }

        Branche::create($validated);

        return back()->with('success', 'Branche créée avec succès.');
    }

    public function update(Request $request, Branche $branch): RedirectResponse
    {
        $validated = $request->validate([
            'name'       => ['required', 'string', 'max:255'],
            'email'      => ['nullable', 'email', 'max:255'],
            'phone'      => ['nullable', 'string', 'max:30'],
            'country_id' => ['nullable', 'exists:countries,id'],
            'region_id'  => ['nullable', 'exists:regions,id'],
            'city_id'     => ['nullable', 'exists:cities,id'],
            'status'     => ['required', 'in:active,inactive'],
            'address'    => ['nullable', 'string', 'max:500'],
            'entity_id'  => ['nullable', 'exists:entities,id'],
        ]);

        if (empty($validated['entity_id'])) {
            $firstEntity = Entity::first();
            if ($firstEntity) {
                $validated['entity_id'] = $firstEntity->id;
            }
        }

        $branch->update($validated);

        return back()->with('success', 'Branche mise à jour.');
    }

    public function destroy(Branche $branch): RedirectResponse
    {
        $branch->delete();
        return back()->with('success', 'Branche supprimée.');
    }
}
