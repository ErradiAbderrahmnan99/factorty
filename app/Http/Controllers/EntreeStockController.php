<?php

namespace App\Http\Controllers;

use App\Models\EntreeStock;
use App\Models\EntreeStockLine;
use App\Models\Product;
use App\Models\Entrepot;
use App\Models\Employee;
use App\Models\Unit;
use App\Services\StockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class EntreeStockController extends Controller
{
    protected StockService $stockService;

    public function __construct(StockService $stockService)
    {
        $this->stockService = $stockService;
    }

    public function index(Request $request)
    {
        $query = EntreeStock::with(['employee', 'lines.product', 'lines.entrepot']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('ref', 'like', "%{$search}%")
                  ->orWhere('motif', 'like', "%{$search}%")
                  ->orWhereHas('employee', function($qe) use ($search) {
                      $qe->where('first_name', 'like', "%{$search}%")
                         ->orWhere('last_name', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $entrees = $query->orderBy('created_at', 'desc')->paginate(10)->withQueryString();

        return Inertia::render('StockMovements/Entree/Index', [
            'entrees' => $entrees,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function create()
    {
        $products = Product::with(['stockUnit'])->orderBy('label')->get();
        $entrepots = Entrepot::orderBy('label')->get();
        $employees = Employee::orderBy('first_name')->get();
        $units = Unit::orderBy('label')->get();

        return Inertia::render('StockMovements/Entree/Create', [
            'products' => $products,
            'entrepots' => $entrepots,
            'employees' => $employees,
            'units' => $units,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'date_entree' => 'required|date',
            'motif' => 'nullable|string',
            'employee_id' => 'nullable|exists:employees,id',
            'lines' => 'required|array|min:1',
            'lines.*.product_id' => 'required|exists:products,id',
            'lines.*.entrepot_id' => 'required|exists:entrepots,id',
            'lines.*.qty' => 'required|numeric|gt:0',
            'lines.*.commentaire' => 'nullable|string',
            'lines.*.lots' => 'nullable|array',
            'lines.*.lots.*.lot_number' => 'required_with:lines.*.lots|string',
            'lines.*.lots.*.quantity' => 'required_with:lines.*.lots|numeric|gt:0',
            'lines.*.lots.*.fabrication_date' => 'nullable|date',
            'lines.*.lots.*.expiration_date' => 'nullable|date',
        ]);

        DB::transaction(function () use ($request) {
            // Generate reference
            $date = now();
            $prefix = 'ENT-' . $date->format('Ym') . '-';
            $last = EntreeStock::where('ref', 'like', $prefix . '%')
                ->orderBy('ref', 'desc')
                ->first();

            $nextNum = 1;
            if ($last) {
                $lastNum = (int) substr($last->ref, -4);
                $nextNum = $lastNum + 1;
            }
            $ref = $prefix . str_pad($nextNum, 4, '0', STR_PAD_LEFT);

            $entree = EntreeStock::create([
                'ref' => $ref,
                'date_entree' => $request->date_entree,
                'motif' => $request->motif,
                'employee_id' => $request->employee_id,
                'status' => 'brouillon',
            ]);

            foreach ($request->lines as $line) {
                $createdLine = EntreeStockLine::create([
                    'entree_stock_id' => $entree->id,
                    'product_id' => $line['product_id'],
                    'entrepot_id' => $line['entrepot_id'],
                    'qty' => $line['qty'],
                    'commentaire' => $line['commentaire'] ?? null,
                ]);

                if (!empty($line['lots'])) {
                    foreach ($line['lots'] as $lot) {
                        $createdLine->lots()->create([
                            'lot_number' => $lot['lot_number'],
                            'quantity' => $lot['quantity'],
                            'fabrication_date' => $lot['fabrication_date'] ?? null,
                            'expiration_date' => $lot['expiration_date'] ?? null,
                        ]);
                    }
                }
            }
        });

        return redirect()->route('entrees-stock.index')->with('success', 'Entrée de stock créée avec succès.');
    }

    public function edit(EntreeStock $entreesStock)
    {
        $entreesStock->load(['lines.product.stockUnit', 'lines.entrepot', 'lines.lots']);
        $products = Product::with(['stockUnit'])->orderBy('label')->get();
        $entrepots = Entrepot::orderBy('label')->get();
        $employees = Employee::orderBy('first_name')->get();
        $units = Unit::orderBy('label')->get();

        return Inertia::render('StockMovements/Entree/Edit', [
            'entree' => $entreesStock,
            'products' => $products,
            'entrepots' => $entrepots,
            'employees' => $employees,
            'units' => $units,
        ]);
    }

    public function update(Request $request, EntreeStock $entreesStock)
    {
        if ($entreesStock->status !== 'brouillon') {
            return redirect()->back()->with('error', 'Vous ne pouvez modifier qu\'une entrée de stock en brouillon.');
        }

        $request->validate([
            'date_entree' => 'required|date',
            'motif' => 'nullable|string',
            'employee_id' => 'nullable|exists:employees,id',
            'lines' => 'required|array|min:1',
            'lines.*.product_id' => 'required|exists:products,id',
            'lines.*.entrepot_id' => 'required|exists:entrepots,id',
            'lines.*.qty' => 'required|numeric|gt:0',
            'lines.*.commentaire' => 'nullable|string',
            'lines.*.lots' => 'nullable|array',
            'lines.*.lots.*.lot_number' => 'required_with:lines.*.lots|string',
            'lines.*.lots.*.quantity' => 'required_with:lines.*.lots|numeric|gt:0',
            'lines.*.lots.*.fabrication_date' => 'nullable|date',
            'lines.*.lots.*.expiration_date' => 'nullable|date',
        ]);

        DB::transaction(function () use ($request, $entreesStock) {
            $entreesStock->update([
                'date_entree' => $request->date_entree,
                'motif' => $request->motif,
                'employee_id' => $request->employee_id,
            ]);

            // Recreate lines
            $entreesStock->lines()->delete();

            foreach ($request->lines as $line) {
                $createdLine = EntreeStockLine::create([
                    'entree_stock_id' => $entreesStock->id,
                    'product_id' => $line['product_id'],
                    'entrepot_id' => $line['entrepot_id'],
                    'qty' => $line['qty'],
                    'commentaire' => $line['commentaire'] ?? null,
                ]);

                if (!empty($line['lots'])) {
                    foreach ($line['lots'] as $lot) {
                        $createdLine->lots()->create([
                            'lot_number' => $lot['lot_number'],
                            'quantity' => $lot['quantity'],
                            'fabrication_date' => $lot['fabrication_date'] ?? null,
                            'expiration_date' => $lot['expiration_date'] ?? null,
                        ]);
                    }
                }
            }
        });

        return redirect()->route('entrees-stock.index')->with('success', 'Entrée de stock mise à jour avec succès.');
    }

    public function destroy(EntreeStock $entreesStock)
    {
        if ($entreesStock->status !== 'brouillon') {
            return redirect()->back()->with('error', 'Vous ne pouvez supprimer qu\'une entrée de stock en brouillon.');
        }

        $entreesStock->delete();
        return redirect()->route('entrees-stock.index')->with('success', 'Entrée de stock supprimée avec succès.');
    }

    public function toggleStatus(Request $request, EntreeStock $entreesStock)
    {
        $newStatus = $request->status;

        if ($newStatus === 'valide' && $entreesStock->status === 'brouillon') {
            $result = $this->stockService->validateAndAddStockForEntree($entreesStock);
            if (!$result['status']) {
                return redirect()->back()->with('error', $result['message']);
            }
            return redirect()->back()->with('success', 'Entrée de stock validée et stock réintégré !');
        }

        if ($newStatus === 'annule' && $entreesStock->status === 'brouillon') {
            $entreesStock->update(['status' => 'annule']);
            return redirect()->back()->with('success', 'Entrée de stock annulée.');
        }

        return redirect()->back()->with('error', 'Statut non modifiable.');
    }
}
