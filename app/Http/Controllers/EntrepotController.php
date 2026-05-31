<?php

namespace App\Http\Controllers;

use App\Models\Entrepot;
use App\Models\Employee;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class EntrepotController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Entrepot::with(['parent', 'employee', 'products']);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('label', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('address', 'like', "%{$search}%")
                  ->orWhereHas('employee', function ($eQ) use ($search) {
                      $eQ->where('first_name', 'like', "%{$search}%")
                         ->orWhere('last_name', 'like', "%{$search}%");
                  });
            });
        }

        $entrepots = $query->paginate(10)->withQueryString();

        // Fetch parent candidates (exclude nothing for general index list, but for edit form we handle self-exclusion dynamically on frontend)
        $parentEntrepots = Entrepot::orderBy('label')->get();
        $employees = Employee::orderBy('last_name')->orderBy('first_name')->get();
        $products = Product::where('status', 'actif')->orderBy('label')->get();

        return Inertia::render('Entrepot/Index', [
            'entrepots'       => $entrepots,
            'parentEntrepots' => $parentEntrepots,
            'employees'       => $employees,
            'products'        => $products,
            'filters'         => $request->only('search'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->merge([
            'parent_id' => $request->input('parent_id') ?: null,
            'assign_to' => $request->input('assign_to') ?: null,
        ]);

        $validated = $request->validate([
            'label'     => ['required', 'string', 'max:255'],
            'code'      => ['required', 'string', 'max:100', 'unique:entrepots,code'],
            'address'   => ['nullable', 'string'],
            'parent_id' => ['nullable', 'exists:entrepots,id'],
            'assign_to' => ['nullable', 'exists:employees,id'],
        ]);

        Entrepot::create([
            'label'     => $validated['label'],
            'code'      => $validated['code'],
            'address'   => $validated['address'],
            'parent_id' => $validated['parent_id'],
            'assign_to' => $validated['assign_to'],
        ]);

        return redirect()->route('entrepots.index')
            ->with('success', 'Entrepôt créé avec succès.');
    }

    public function update(Request $request, Entrepot $entrepot): RedirectResponse
    {
        $request->merge([
            'parent_id' => $request->input('parent_id') ?: null,
            'assign_to' => $request->input('assign_to') ?: null,
        ]);

        $validated = $request->validate([
            'label'     => ['required', 'string', 'max:255'],
            'code'      => ['required', 'string', 'max:100', "unique:entrepots,code,{$entrepot->id}"],
            'address'   => ['nullable', 'string'],
            'parent_id' => [
                'nullable',
                'exists:entrepots,id',
                function ($attribute, $value, $fail) use ($entrepot) {
                    if ($value == $entrepot->id) {
                        $fail("L'entrepôt parent ne peut pas être l'entrepôt lui-même.");
                    }
                }
            ],
            'assign_to' => ['nullable', 'exists:employees,id'],
        ]);

        $entrepot->update([
            'label'     => $validated['label'],
            'code'      => $validated['code'],
            'address'   => $validated['address'],
            'parent_id' => $validated['parent_id'],
            'assign_to' => $validated['assign_to'],
        ]);

        return redirect()->route('entrepots.index')
            ->with('success', 'Entrepôt mis à jour avec succès.');
    }

    public function destroy(Entrepot $entrepot): RedirectResponse
    {
        $entrepot->delete();

        return redirect()->route('entrepots.index')
            ->with('success', 'Entrepôt supprimé avec succès.');
    }
}
