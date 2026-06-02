<?php

namespace App\Http\Controllers;

use App\Models\Tier;
use App\Models\TierCategory;
use App\Models\Country;
use App\Models\Region;
use App\Models\City;
use App\Models\TypeApprobateur;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class TierController extends Controller
{
    /**
     * Valid tier types and their French labels.
     */
    private array $typeLabels = [
        'prospect'     => 'Prospect',
        'client'       => 'Client',
        'fournisseur'  => 'Fournisseur',
    ];

    public function index(Request $request, string $type): Response
    {
        abort_unless(array_key_exists($type, $this->typeLabels), 404);

        $search   = $request->input('search');
        $status   = $request->input('status');
        $catId    = $request->input('tier_category_id');

        $tiers = Tier::query()
            ->where('type', $type)
            ->with(['tierCategory', 'city', 'country', 'parent', 'typeApprobateur'])
            ->when($search, fn ($q) => $q->where(function ($q2) use ($search) {
                $q2->where('label', 'like', "%{$search}%")
                   ->orWhere('ref', 'like', "%{$search}%")
                   ->orWhere('email', 'like', "%{$search}%");
            }))
            ->when($status, fn ($q) => $q->where('status', $status))
            ->when($catId, fn ($q) => $q->where('tier_category_id', $catId))
            ->orderBy('label')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Tier/Index', [
            'tiers'          => $tiers,
            'type'           => $type,
            'typeLabel'      => $this->typeLabels[$type],
            'tierCategories' => TierCategory::orderBy('label')->get(),
            'filters'        => compact('search', 'status', 'catId'),
        ]);
    }

    public function create(string $type): Response
    {
        abort_unless(array_key_exists($type, $this->typeLabels), 404);
        $legalForms = ['SARL', 'SA', 'SNC', 'SCS', 'Auto-Entrepreneur', 'Succursale'];

        return Inertia::render('Tier/Create', [
            'type'           => $type,
            'typeLabel'      => $this->typeLabels[$type],
            'tierCategories' => TierCategory::orderBy('label')->get(),
            'countries'      => Country::orderBy('label')->get(),
            'regions'        => Region::with('country')->orderBy('label')->get(),
            'cities'         => City::with('region')->orderBy('label')->get(),
            'legalForms'     => $legalForms,
            'parents'        => Tier::where('type', $type)->orderBy('label')->get(['id', 'label', 'ref']),
            'typesApprobateur'=> TypeApprobateur::orderBy('label')->get(),
        ]);
    }

    public function store(Request $request, string $type): RedirectResponse
    {
        abort_unless(array_key_exists($type, $this->typeLabels), 404);

        $validated = $request->validate([
            'ref'             => ['required', 'string', 'max:100', 'unique:tiers,ref'],
            'label'           => ['required', 'string', 'max:255'],
            'is_professionnel'=> ['boolean'],
            'description'     => ['nullable', 'string'],
            'parent_id'       => ['nullable', 'exists:tiers,id'],
            'tier_category_id'=> ['required', 'exists:tier_categories,id'],
            'type_approbateur_id'=> ['nullable', 'exists:types_approbateur,id'],
            'address'         => ['nullable', 'string', 'max:500'],
            'country_id'      => ['nullable', 'exists:countries,id'],
            'region_id'       => ['nullable', 'exists:regions,id'],
            'city_id'         => ['nullable', 'exists:cities,id'],
            'legal_form'      => ['nullable', 'string', 'max:100'],
            'if_fiscal'       => ['nullable', 'string', 'max:50'],
            'ice'             => ['nullable', 'string', 'max:50'],
            'rc'              => ['nullable', 'string', 'max:50'],
            'cnss'            => ['nullable', 'string', 'max:50'],
            'tp'              => ['nullable', 'string', 'max:50'],
            'rib'             => ['nullable', 'string', 'max:100'],
            'emploi'          => ['nullable', 'string', 'max:100'],
            'email'           => ['nullable', 'email', 'max:255'],
            'telephone'       => ['nullable', 'string', 'max:30'],
            'website'         => ['nullable', 'string', 'max:255'],
            'fax'             => ['nullable', 'string', 'max:30'],
            'linkedin'        => ['nullable', 'string', 'max:255'],
            'twitter'         => ['nullable', 'string', 'max:255'],
            'facebook'        => ['nullable', 'string', 'max:255'],
            'instagram'       => ['nullable', 'string', 'max:255'],
            'status'          => ['required', 'in:actif,inactif'],
        ]);

        $validated['type'] = $type;
        Tier::create($validated);

        return redirect()->route("tiers.{$type}.index")
            ->with('success', "{$this->typeLabels[$type]} créé avec succès.");
    }

    public function edit(Tier $tier, string $type): Response
    {
        abort_unless(array_key_exists($type, $this->typeLabels), 404);
        abort_unless($tier->type === $type, 404);
        $legalForms = ['SARL', 'SA', 'SNC', 'SCS', 'Auto-Entrepreneur', 'Succursale'];

        return Inertia::render('Tier/Edit', [
            'tier'           => $tier,
            'type'           => $type,
            'typeLabel'      => $this->typeLabels[$type],
            'tierCategories' => TierCategory::orderBy('label')->get(),
            'countries'      => Country::orderBy('label')->get(),
            'regions'        => Region::with('country')->orderBy('label')->get(),
            'cities'         => City::with('region')->orderBy('label')->get(),
            'legalForms'     => $legalForms,
            'parents'        => Tier::where('type', $type)
                                    ->where('id', '!=', $tier->id)
                                    ->orderBy('label')->get(['id', 'label', 'ref']),
            'typesApprobateur'=> TypeApprobateur::orderBy('label')->get(),
        ]);
    }

    public function update(Request $request, Tier $tier, string $type): RedirectResponse
    {
        abort_unless(array_key_exists($type, $this->typeLabels), 404);
        abort_unless($tier->type === $type, 404);

        $validated = $request->validate([
            'ref'             => ['nullable', 'string', 'max:100', "unique:tiers,ref,{$tier->id}"],
            'label'           => ['required', 'string', 'max:255'],
            'is_professionnel'=> ['boolean'],
            'description'     => ['nullable', 'string'],
            'parent_id'       => ['nullable', 'exists:tiers,id'],
            'tier_category_id'=> ['nullable', 'exists:tier_categories,id'],
            'type_approbateur_id'=> ['nullable', 'exists:types_approbateur,id'],
            'address'         => ['nullable', 'string', 'max:500'],
            'country_id'      => ['nullable', 'exists:countries,id'],
            'region_id'       => ['nullable', 'exists:regions,id'],
            'city_id'         => ['nullable', 'exists:cities,id'],
            'legal_form'      => ['nullable', 'string', 'max:100'],
            'if_fiscal'       => ['nullable', 'string', 'max:50'],
            'ice'             => ['nullable', 'string', 'max:50'],
            'rc'              => ['nullable', 'string', 'max:50'],
            'cnss'            => ['nullable', 'string', 'max:50'],
            'tp'              => ['nullable', 'string', 'max:50'],
            'rib'             => ['nullable', 'string', 'max:100'],
            'emploi'          => ['nullable', 'string', 'max:100'],
            'email'           => ['nullable', 'email', 'max:255'],
            'telephone'       => ['nullable', 'string', 'max:30'],
            'website'         => ['nullable', 'string', 'max:255'],
            'fax'             => ['nullable', 'string', 'max:30'],
            'linkedin'        => ['nullable', 'string', 'max:255'],
            'twitter'         => ['nullable', 'string', 'max:255'],
            'facebook'        => ['nullable', 'string', 'max:255'],
            'instagram'       => ['nullable', 'string', 'max:255'],
            'status'          => ['required', 'in:actif,inactif'],
        ]);

        $tier->update($validated);

        return redirect()->route("tiers.{$type}.index")
            ->with('success', "{$this->typeLabels[$type]} mis à jour avec succès.");
    }

    public function toggleStatus(Tier $tier, string $type): RedirectResponse
    {
        abort_unless($tier->type === $type, 404);
        $tier->status = $tier->status === 'actif' ? 'inactif' : 'actif';
        $tier->save();
        return back()->with('success', 'Statut mis à jour.');
    }

    public function destroy(Tier $tier, string $type): RedirectResponse
    {
        abort_unless($tier->type === $type, 404);
        $tier->delete();
        return redirect()->route("tiers.{$type}.index")
            ->with('success', "{$this->typeLabels[$type]} supprimé.");
    }
}
