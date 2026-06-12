<?php

namespace App\Http\Controllers;

use App\Models\Entity;
use App\Models\Country;
use App\Models\Region;
use App\Models\City;
use App\Models\Devise;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class EntityController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Entity/Index', [
            'entities'  => Entity::with(['country', 'region', 'city', 'devise'])->orderBy('label')->get(),
            'countries' => Country::orderBy('label')->get(),
            'regions'   => Region::orderBy('label')->get(),
            'cities'    => City::orderBy('label')->get(),
            'devises'    => Devise::orderBy('label')->get(),
            'legalForms' => ['SARL', 'SA', 'SNC', 'SCS', 'Auto-Entrepreneur', 'Succursale'],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        if (Entity::count() >= 1) {
            return back()->withErrors(['label' => 'Une seule entité est autorisée dans le système.']);
        }

        $validated = $request->validate([
            'code'               => ['nullable', 'string', 'max:100'],
            'label'              => ['required', 'string', 'max:255'],
            'adress'             => ['nullable', 'string'],
            'country_id'         => ['nullable', 'exists:countries,id'],
            'region_id'          => ['nullable', 'exists:regions,id'],
            'city_id'            => ['nullable', 'exists:cities,id'],
            'devise_id'          => ['nullable', 'exists:devises,id'],
            'code_postal'        => ['nullable', 'string', 'max:20'],
            'tele'               => ['nullable', 'string', 'max:50'],
            'email'              => ['nullable', 'email', 'max:255'],
            'rc'                 => ['nullable', 'string', 'max:50'],
            'patente'            => ['nullable', 'string', 'max:50'],
            'if'                 => ['nullable', 'string', 'max:50'],
            'ice'                => ['nullable', 'string', 'max:50'],
            'cnss'               => ['nullable', 'string', 'max:50'],
            'forme_juridique'    => ['nullable', 'string', 'max:100'],
            'default_tva'        => ['required', 'numeric', 'min:0', 'max:100'],
            'number_after_comma' => ['required', 'integer', 'min:0', 'max:6'],
        ]);

        Entity::create($validated);

        return back()->with('success', 'Entité créée avec succès.');
    }

    public function update(Request $request, Entity $entity): RedirectResponse
    {
        $validated = $request->validate([
            'code'               => ['nullable', 'string', 'max:100'],
            'label'              => ['required', 'string', 'max:255'],
            'adress'             => ['nullable', 'string'],
            'country_id'         => ['nullable', 'exists:countries,id'],
            'region_id'          => ['nullable', 'exists:regions,id'],
            'city_id'            => ['nullable', 'exists:cities,id'],
            'devise_id'          => ['nullable', 'exists:devises,id'],
            'code_postal'        => ['nullable', 'string', 'max:20'],
            'tele'               => ['nullable', 'string', 'max:50'],
            'email'              => ['nullable', 'email', 'max:255'],
            'rc'                 => ['nullable', 'string', 'max:50'],
            'patente'            => ['nullable', 'string', 'max:50'],
            'if'                 => ['nullable', 'string', 'max:50'],
            'ice'                => ['nullable', 'string', 'max:50'],
            'cnss'               => ['nullable', 'string', 'max:50'],
            'forme_juridique'    => ['nullable', 'string', 'max:100'],
            'default_tva'        => ['required', 'numeric', 'min:0', 'max:100'],
            'number_after_comma' => ['required', 'integer', 'min:0', 'max:6'],
        ]);

        $entity->update($validated);

        return back()->with('success', 'Entité mise à jour avec succès.');
    }

    public function destroy(Entity $entity): RedirectResponse
    {
        $entity->delete();
        return back()->with('success', 'Entité supprimée.');
    }
}
