<?php

namespace App\Http\Controllers;

use App\Models\UnitCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class UnitCategoryController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->input('search');

        $unitCategories = UnitCategory::query()
            ->when($search, function ($query, $search) {
                $query->where('label', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            })
            ->orderBy('label')
            ->get();

        return Inertia::render('UnitCategory/Index', [
            'unitCategories' => $unitCategories,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'label' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:50'],
            'description' => ['nullable', 'string'],
        ]);

        UnitCategory::create($validated);

        return redirect()->route('unit-categories.index')
            ->with('success', 'Catégorie d\'unité créée avec succès.');
    }

    public function update(Request $request, UnitCategory $unitCategory): RedirectResponse
    {
        $validated = $request->validate([
            'label' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:50'],
            'description' => ['nullable', 'string'],
        ]);

        $unitCategory->update($validated);

        return redirect()->route('unit-categories.index')
            ->with('success', 'Catégorie d\'unité mise à jour avec succès.');
    }

    public function destroy(UnitCategory $unitCategory): RedirectResponse
    {
        $unitCategory->delete();

        return redirect()->route('unit-categories.index')
            ->with('success', 'Catégorie d\'unité supprimée avec succès.');
    }
}
