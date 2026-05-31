<?php

namespace App\Http\Controllers;

use App\Models\Livraison;
use App\Models\LivraisonLine;
use App\Models\LivraisonLineLot;
use App\Models\Tier;
use App\Models\Product;
use App\Models\Devise;
use App\Models\Unit;
use App\Models\Employee;
use App\Models\Entrepot;
use App\Models\ProductEntrepot;
use App\Models\ProductLot;
use App\Services\StockService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class LivraisonController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Livraison::with(['tier', 'devise'])
            ->orderBy('created_at', 'desc');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('ref', 'like', "%{$search}%")
                  ->orWhere('commercial', 'like', "%{$search}%")
                  ->orWhereHas('tier', function ($tQ) use ($search) {
                      $tQ->where('label', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $livraisons = $query->paginate(10)->withQueryString();

        return Inertia::render('Livraison/Index', [
            'livraisons' => $livraisons,
            'filters'    => $request->only('search', 'status'),
        ]);
    }

    public function create(): Response
    {
        $tiers = Tier::where('type', 'client')
            ->where('status', 'actif')
            ->orderBy('label')
            ->get();

        $products = Product::where('status', 'actif')
            ->with(['saleUnit', 'stockUnit'])
            ->orderBy('label')
            ->get();

        $devises = Devise::orderBy('label')->get();
        $units = Unit::orderBy('label')->get();
        $entrepots = Entrepot::orderBy('label')->get();
        
        $commercials = Employee::whereIn('type', ['commercial', 'agent'])
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();

        return Inertia::render('Livraison/Create', [
            'tiers'        => $tiers,
            'products'     => $products,
            'devises'      => $devises,
            'units'        => $units,
            'entrepots'    => $entrepots,
            'commercials'  => $commercials,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'tier_id'              => ['required', 'exists:tiers,id'],
            'commercial'           => ['nullable', 'string', 'max:255'],
            'date_livraison'       => ['required', 'date'],
            'devise_id'            => ['required', 'exists:devises,id'],
            'lines'                => ['required', 'array', 'min:1'],
            'lines.*.product_id'   => ['required', 'exists:products,id'],
            'lines.*.entrepot_id'  => ['required', 'exists:entrepots,id'],
            'lines.*.sale_unit_id' => ['nullable', 'exists:units,id'],
            'lines.*.tva'          => ['required', 'numeric', 'min:0'],
            'lines.*.qty'          => ['required', 'numeric', 'min:0.0001'],
            'lines.*.pu_ht'        => ['required', 'numeric', 'min:0'],
            'lines.*.pu_ttc'       => ['required', 'numeric', 'min:0'],
            'lines.*.remise'       => ['nullable', 'numeric', 'min:0', 'max:100'],
            'lines.*.rm'           => ['nullable', 'numeric', 'min:0'],
            'lines.*.lots'         => ['nullable', 'array'],
            'lines.*.lots.*.lot_number' => ['required_with:lines.*.lots', 'string'],
            'lines.*.lots.*.quantity'   => ['required_with:lines.*.lots', 'numeric', 'min:0.0001'],
            'lines.*.lots.*.fabrication_date' => ['nullable', 'date'],
            'lines.*.lots.*.expiration_date'  => ['nullable', 'date'],
        ]);

        DB::transaction(function () use ($request) {
            // Generate Reference automatically: BL-YYYYMM-XXXX
            $date = date('Ym', strtotime($request->input('date_livraison')));
            $count = Livraison::whereYear('date_livraison', date('Y', strtotime($request->input('date_livraison'))))
                ->whereMonth('date_livraison', date('m', strtotime($request->input('date_livraison'))))
                ->count();
            
            $nextNum = str_pad($count + 1, 4, '0', STR_PAD_LEFT);
            $ref = "BL-{$date}-{$nextNum}";

            // Calculate totals
            $totalHt = 0;
            $totalTtc = 0;

            $linesData = [];
            foreach ($request->input('lines') as $line) {
                $qty = (double)$line['qty'];
                $puHt = (double)$line['pu_ht'];
                $tva = (double)$line['tva'];
                $remise = (double)($line['remise'] ?? 0);
                $rm = (double)($line['rm'] ?? 0);

                $lineHt = $qty * $puHt;
                $discount = ($lineHt * $remise / 100) + $rm;
                $lineTotalHt = max(0, $lineHt - $discount);
                $lineTotalTtc = $lineTotalHt * (1 + $tva / 100);

                $totalHt += $lineTotalHt;
                $totalTtc += $lineTotalTtc;

                $linesData[] = [
                    'product_id'   => $line['product_id'],
                    'entrepot_id'  => $line['entrepot_id'],
                    'sale_unit_id' => $line['sale_unit_id'] ?? null,
                    'tva'          => $tva,
                    'qty'          => $qty,
                    'pu_ht'        => $puHt,
                    'pu_ttc'       => $line['pu_ttc'],
                    'remise'       => $remise,
                    'rm'           => $rm,
                    'total_ht'     => $lineTotalHt,
                    'total_ttc'    => $lineTotalTtc,
                    'lots'         => $line['lots'] ?? [],
                ];
            }

            $totalTva = max(0, $totalTtc - $totalHt);

            $livraison = Livraison::create([
                'ref'            => $ref,
                'tier_id'        => $request->input('tier_id'),
                'commercial'     => $request->input('commercial'),
                'date_livraison' => $request->input('date_livraison'),
                'devise_id'      => $request->input('devise_id'),
                'status'         => 'brouillon',
                'total_ht'       => $totalHt,
                'total_tva'      => $totalTva,
                'total_ttc'      => $totalTtc,
            ]);

            foreach ($linesData as $lData) {
                $lots = $lData['lots'];
                unset($lData['lots']);
                
                $lLine = $livraison->lines()->create($lData);
                
                foreach ($lots as $lot) {
                    $lLine->lots()->create([
                        'lot_number'       => $lot['lot_number'],
                        'quantity'         => $lot['quantity'],
                        'fabrication_date' => $lot['fabrication_date'] ?? null,
                        'expiration_date'  => $lot['expiration_date'] ?? null,
                    ]);
                }
            }
        });

        return redirect()->route('livraisons.index')->with('success', 'Bon de livraison créé avec succès.');
    }

    public function edit(Livraison $livraison): Response
    {
        $livraison->load(['lines.product', 'lines.saleUnit', 'lines.lots']);

        $tiers = Tier::where('type', 'client')
            ->where('status', 'actif')
            ->orderBy('label')
            ->get();

        $products = Product::where('status', 'actif')
            ->with(['saleUnit', 'stockUnit'])
            ->orderBy('label')
            ->get();

        $devises = Devise::orderBy('label')->get();
        $units = Unit::orderBy('label')->get();
        $entrepots = Entrepot::orderBy('label')->get();
        
        $commercials = Employee::whereIn('type', ['commercial', 'agent'])
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();

        return Inertia::render('Livraison/Edit', [
            'livraison'    => $livraison,
            'tiers'        => $tiers,
            'products'     => $products,
            'devises'      => $devises,
            'units'        => $units,
            'entrepots'    => $entrepots,
            'commercials'  => $commercials,
        ]);
    }

    public function update(Request $request, Livraison $livraison): RedirectResponse
    {
        if ($livraison->status === 'valide') {
            return back()->with('error', 'Un bon de livraison validé ne peut pas être modifié.');
        }

        $request->validate([
            'tier_id'              => ['required', 'exists:tiers,id'],
            'commercial'           => ['nullable', 'string', 'max:255'],
            'date_livraison'       => ['required', 'date'],
            'devise_id'            => ['required', 'exists:devises,id'],
            'lines'                => ['required', 'array', 'min:1'],
            'lines.*.product_id'   => ['required', 'exists:products,id'],
            'lines.*.entrepot_id'  => ['required', 'exists:entrepots,id'],
            'lines.*.sale_unit_id' => ['nullable', 'exists:units,id'],
            'lines.*.tva'          => ['required', 'numeric', 'min:0'],
            'lines.*.qty'          => ['required', 'numeric', 'min:0.0001'],
            'lines.*.pu_ht'        => ['required', 'numeric', 'min:0'],
            'lines.*.pu_ttc'       => ['required', 'numeric', 'min:0'],
            'lines.*.remise'       => ['nullable', 'numeric', 'min:0', 'max:100'],
            'lines.*.rm'           => ['nullable', 'numeric', 'min:0'],
            'lines.*.lots'         => ['nullable', 'array'],
            'lines.*.lots.*.lot_number' => ['required_with:lines.*.lots', 'string'],
            'lines.*.lots.*.quantity'   => ['required_with:lines.*.lots', 'numeric', 'min:0.0001'],
            'lines.*.lots.*.fabrication_date' => ['nullable', 'date'],
            'lines.*.lots.*.expiration_date'  => ['nullable', 'date'],
        ]);

        DB::transaction(function () use ($request, $livraison) {
            // Calculate totals
            $totalHt = 0;
            $totalTtc = 0;

            $linesData = [];
            foreach ($request->input('lines') as $line) {
                $qty = (double)$line['qty'];
                $puHt = (double)$line['pu_ht'];
                $tva = (double)$line['tva'];
                $remise = (double)($line['remise'] ?? 0);
                $rm = (double)($line['rm'] ?? 0);

                $lineHt = $qty * $puHt;
                $discount = ($lineHt * $remise / 100) + $rm;
                $lineTotalHt = max(0, $lineHt - $discount);
                $lineTotalTtc = $lineTotalHt * (1 + $tva / 100);

                $totalHt += $lineTotalHt;
                $totalTtc += $lineTotalTtc;

                $linesData[] = [
                    'product_id'   => $line['product_id'],
                    'entrepot_id'  => $line['entrepot_id'],
                    'sale_unit_id' => $line['sale_unit_id'] ?? null,
                    'tva'          => $tva,
                    'qty'          => $qty,
                    'pu_ht'        => $puHt,
                    'pu_ttc'       => $line['pu_ttc'],
                    'remise'       => $remise,
                    'rm'           => $rm,
                    'total_ht'     => $lineTotalHt,
                    'total_ttc'    => $lineTotalTtc,
                    'lots'         => $line['lots'] ?? [],
                ];
            }

            $totalTva = max(0, $totalTtc - $totalHt);

            $livraison->update([
                'tier_id'        => $request->input('tier_id'),
                'commercial'     => $request->input('commercial'),
                'date_livraison' => $request->input('date_livraison'),
                'devise_id'      => $request->input('devise_id'),
                'total_ht'       => $totalHt,
                'total_tva'      => $totalTva,
                'total_ttc'      => $totalTtc,
            ]);

            // Recreate Lines
            $livraison->lines()->delete();

            foreach ($linesData as $lData) {
                $lots = $lData['lots'];
                unset($lData['lots']);
                
                $lLine = $livraison->lines()->create($lData);
                
                foreach ($lots as $lot) {
                    $lLine->lots()->create([
                        'lot_number'       => $lot['lot_number'],
                        'quantity'         => $lot['quantity'],
                        'fabrication_date' => $lot['fabrication_date'] ?? null,
                        'expiration_date'  => $lot['expiration_date'] ?? null,
                    ]);
                }
            }
        });

        return redirect()->route('livraisons.index')->with('success', 'Bon de livraison mis à jour avec succès.');
    }

    public function destroy(Livraison $livraison): RedirectResponse
    {
        if ($livraison->status === 'valide') {
            return back()->with('error', 'Un bon de livraison validé ne peut pas être supprimé.');
        }

        $livraison->delete();

        return redirect()->route('livraisons.index')->with('success', 'Bon de livraison supprimé avec succès.');
    }

    /**
     * Update livraison status dynamically and touch stock when validating
     */
    public function updateStatus(Request $request, Livraison $livraison): RedirectResponse
    {
        $request->validate([
            'status' => ['required', 'string', 'in:brouillon,valide,annule'],
        ]);

        $newStatus = $request->input('status');

        if ($newStatus === 'valide') {
            $stockService = new StockService();
            $result = $stockService->validateAndDeductStockForLivraison($livraison);

            if (!$result['status']) {
                return back()->with('error', $result['message']);
            }
        } else {
            $livraison->update([
                'status' => $newStatus,
            ]);
        }

        return back()->with('success', 'Statut du bon de livraison mis à jour.');
    }
}
