<?php

namespace App\Http\Controllers;

use App\Models\TierCategory;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class TierCategoryController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('TierCategory/Index', [
            'tierCategories' => TierCategory::orderBy('label')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'code'        => ['required', 'string', 'max:30', 'unique:tier_categories,code'],
            'label'       => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);
        TierCategory::create($request->only('code', 'label', 'description'));
        return back()->with('success', 'Catégorie de tiers créée.');
    }

    public function update(Request $request, TierCategory $tierCategory): RedirectResponse
    {
        $request->validate([
            'code'        => ['required', 'string', 'max:30', "unique:tier_categories,code,{$tierCategory->id}"],
            'label'       => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);
        $tierCategory->update($request->only('code', 'label', 'description'));
        return back()->with('success', 'Catégorie de tiers mise à jour.');
    }

    public function destroy(TierCategory $tierCategory): RedirectResponse
    {
        $tierCategory->delete();
        return back()->with('success', 'Catégorie de tiers supprimée.');
    }
}
