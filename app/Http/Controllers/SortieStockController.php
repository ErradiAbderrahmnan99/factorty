<?php

namespace App\Http\Controllers;

use App\Models\SortieStock;
use App\Models\SortieStockLine;
use App\Models\Product;
use App\Models\Entrepot;
use App\Models\Employee;
use App\Models\Unit;
use App\Models\ProductLot;
use App\Services\StockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SortieStockController extends Controller
{
    protected StockService $stockService;

    public function __construct(StockService $stockService)
    {
        $this->stockService = $stockService;
    }

    public function index(Request $request)
    {
        $query = SortieStock::with(['employee', 'lines.product', 'lines.entrepot']);

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

        $sorties = $query->orderBy('created_at', 'desc')->paginate(10)->withQueryString();

        return Inertia::render('StockMovements/Sortie/Index', [
            'sorties' => $sorties,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function create()
    {
        $products = Product::with(['stockUnit'])->orderBy('label')->get();
        $entrepots = Entrepot::orderBy('label')->get();
        $employees = Employee::orderBy('first_name')->get();
        $units = Unit::orderBy('label')->get();

        return Inertia::render('StockMovements/Sortie/Create', [
            'products' => $products,
            'entrepots' => $entrepots,
            'employees' => $employees,
            'units' => $units,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'date_sortie' => 'required|date',
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
        ]);

        DB::transaction(function () use ($request) {
            // Generate reference
            $date = now();
            $prefix = 'SOR-' . $date->format('Ym') . '-';
            $last = SortieStock::where('ref', 'like', $prefix . '%')
                ->orderBy('ref', 'desc')
                ->first();

            $nextNum = 1;
            if ($last) {
                $lastNum = (int) substr($last->ref, -4);
                $nextNum = $lastNum + 1;
            }
            $ref = $prefix . str_pad($nextNum, 4, '0', STR_PAD_LEFT);

            $sortie = SortieStock::create([
                'ref' => $ref,
                'date_sortie' => $request->date_sortie,
                'motif' => $request->motif,
                'employee_id' => $request->employee_id,
                'status' => 'brouillon',
            ]);

            foreach ($request->lines as $line) {
                $createdLine = SortieStockLine::create([
                    'sortie_stock_id' => $sortie->id,
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
                        ]);
                    }
                }
            }
        });

        return redirect()->route('sorties-stock.index')->with('success', 'Sortie de stock créée avec succès.');
    }

    public function edit(SortieStock $sortiesStock)
    {
        $sortiesStock->load(['lines.product.stockUnit', 'lines.entrepot', 'lines.lots']);
        $products = Product::with(['stockUnit'])->orderBy('label')->get();
        $entrepots = Entrepot::orderBy('label')->get();
        $employees = Employee::orderBy('first_name')->get();
        $units = Unit::orderBy('label')->get();

        return Inertia::render('StockMovements/Sortie/Edit', [
            'sortie' => $sortiesStock,
            'products' => $products,
            'entrepots' => $entrepots,
            'employees' => $employees,
            'units' => $units,
        ]);
    }

    public function update(Request $request, SortieStock $sortiesStock)
    {
        if ($sortiesStock->status !== 'brouillon') {
            return redirect()->back()->with('error', 'Vous ne pouvez modifier qu\'une sortie de stock en brouillon.');
        }

        $request->validate([
            'date_sortie' => 'required|date',
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
        ]);

        DB::transaction(function () use ($request, $sortiesStock) {
            $sortiesStock->update([
                'date_sortie' => $request->date_sortie,
                'motif' => $request->motif,
                'employee_id' => $request->employee_id,
            ]);

            // Recreate lines
            $sortiesStock->lines()->delete();

            foreach ($request->lines as $line) {
                $createdLine = SortieStockLine::create([
                    'sortie_stock_id' => $sortiesStock->id,
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
                        ]);
                    }
                }
            }
        });

        return redirect()->route('sorties-stock.index')->with('success', 'Sortie de stock mise à jour avec succès.');
    }

    public function destroy(SortieStock $sortiesStock)
    {
        if ($sortiesStock->status !== 'brouillon') {
            return redirect()->back()->with('error', 'Vous ne pouvez supprimer qu\'une sortie de stock en brouillon.');
        }

        $sortiesStock->delete();
        return redirect()->route('sorties-stock.index')->with('success', 'Sortie de stock supprimée avec succès.');
    }

    public function toggleStatus(Request $request, SortieStock $sortiesStock)
    {
        $newStatus = $request->status;

        if ($newStatus === 'valide' && $sortiesStock->status === 'brouillon') {
            $result = $this->stockService->validateAndDeductStockForSortie($sortiesStock);
            if (!$result['status']) {
                return redirect()->back()->with('error', $result['message']);
            }
            return redirect()->back()->with('success', 'Sortie de stock validée et stock déduit !');
        }

        if ($newStatus === 'annule' && $sortiesStock->status === 'brouillon') {
            $sortiesStock->update(['status' => 'annule']);
            return redirect()->back()->with('success', 'Sortie de stock annulée.');
        }

        return redirect()->back()->with('error', 'Statut non modifiable.');
    }

    /**
     * API to fetch available lots for a given product and warehouse.
     */
    public function getProductLots(Product $product, Entrepot $entrepot)
    {
        $lots = ProductLot::where('product_id', $product->id)
            ->where('entrepot_id', $entrepot->id)
            ->where('quantity', '>', 0)
            ->get();

        return response()->json($lots);
    }
}
