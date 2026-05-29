<?php

namespace App\Http\Controllers;

use App\Models\Unit;
use App\Models\UnitCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class UnitController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->input('search');

        $units = Unit::query()
            ->with('unitCategory')
            ->when($search, function ($query, $search) {
                $query->where('label', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhereHas('unitCategory', function ($q) use ($search) {
                        $q->where('label', 'like', "%{$search}%");
                    });
            })
            ->orderBy('label')
            ->get();

        $unitCategories = UnitCategory::orderBy('label')->get();

        return Inertia::render('Unit/Index', [
            'units' => $units,
            'unitCategories' => $unitCategories,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'unit_category_id' => ['required', 'exists:unit_categories,id'],
            'label' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:50'],
            'ratio' => ['required', 'numeric', 'min:0.000001'],
        ]);

        Unit::create($validated);

        return redirect()->route('units.index')
            ->with('success', 'Unité créée avec succès.');
    }

    public function update(Request $request, Unit $unit): RedirectResponse
    {
        $validated = $request->validate([
            'unit_category_id' => ['required', 'exists:unit_categories,id'],
            'label' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:50'],
            'ratio' => ['required', 'numeric', 'min:0.000001'],
        ]);

        $unit->update($validated);

        return redirect()->route('units.index')
            ->with('success', 'Unité mise à jour avec succès.');
    }

    public function destroy(Unit $unit): RedirectResponse
    {
        $unit->delete();

        return redirect()->route('units.index')
            ->with('success', 'Unité supprimée avec succès.');
    }
}
