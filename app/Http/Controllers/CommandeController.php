<?php

namespace App\Http\Controllers;

use App\Models\Commande;
use App\Models\CommandeLine;
use App\Models\CommandeLineLot;
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

class CommandeController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Commande::with(['tier', 'devise'])
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

        $commandes = $query->paginate(10)->withQueryString();

        return Inertia::render('Commande/Index', [
            'commandes' => $commandes,
            'filters'   => $request->only('search', 'status'),
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

        return Inertia::render('Commande/Create', [
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
            'date_commande'        => ['required', 'date'],
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
            // Generate Reference automatically: CC-YYYYMM-XXXX
            $date = date('Ym', strtotime($request->input('date_commande')));
            $count = Commande::whereYear('date_commande', date('Y', strtotime($request->input('date_commande'))))
                ->whereMonth('date_commande', date('m', strtotime($request->input('date_commande'))))
                ->count();
            
            $nextNum = str_pad($count + 1, 4, '0', STR_PAD_LEFT);
            $ref = "CC-{$date}-{$nextNum}";

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

            $commande = Commande::create([
                'ref'           => $ref,
                'tier_id'       => $request->input('tier_id'),
                'commercial'    => $request->input('commercial'),
                'date_commande' => $request->input('date_commande'),
                'devise_id'     => $request->input('devise_id'),
                'status'        => 'brouillon',
                'total_ht'      => $totalHt,
                'total_tva'     => $totalTva,
                'total_ttc'     => $totalTtc,
            ]);

            foreach ($linesData as $lData) {
                $lots = $lData['lots'];
                unset($lData['lots']);
                
                $cLine = $commande->lines()->create($lData);
                
                foreach ($lots as $lot) {
                    $cLine->lots()->create([
                        'lot_number'       => $lot['lot_number'],
                        'quantity'         => $lot['quantity'],
                        'fabrication_date' => $lot['fabrication_date'] ?? null,
                        'expiration_date'  => $lot['expiration_date'] ?? null,
                    ]);
                }
            }
        });

        return redirect()->route('commandes.index')->with('success', 'Commande créée avec succès.');
    }

    public function edit(Commande $commande): Response
    {
        $commande->load(['lines.product', 'lines.saleUnit', 'lines.lots']);

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

        return Inertia::render('Commande/Edit', [
            'commande'     => $commande,
            'tiers'        => $tiers,
            'products'     => $products,
            'devises'      => $devises,
            'units'        => $units,
            'entrepots'    => $entrepots,
            'commercials'  => $commercials,
        ]);
    }

    public function update(Request $request, Commande $commande): RedirectResponse
    {
        if ($commande->status === 'valide') {
            return back()->with('error', 'Une commande validée ne peut pas être modifiée.');
        }

        $request->validate([
            'tier_id'              => ['required', 'exists:tiers,id'],
            'commercial'           => ['nullable', 'string', 'max:255'],
            'date_commande'        => ['required', 'date'],
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

        DB::transaction(function () use ($request, $commande) {
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

            $commande->update([
                'tier_id'       => $request->input('tier_id'),
                'commercial'    => $request->input('commercial'),
                'date_commande' => $request->input('date_commande'),
                'devise_id'     => $request->input('devise_id'),
                'total_ht'      => $totalHt,
                'total_tva'     => $totalTva,
                'total_ttc'     => $totalTtc,
            ]);

            // Recreate Lines
            $commande->lines()->delete();

            foreach ($linesData as $lData) {
                $lots = $lData['lots'];
                unset($lData['lots']);
                
                $cLine = $commande->lines()->create($lData);
                
                foreach ($lots as $lot) {
                    $cLine->lots()->create([
                        'lot_number'       => $lot['lot_number'],
                        'quantity'         => $lot['quantity'],
                        'fabrication_date' => $lot['fabrication_date'] ?? null,
                        'expiration_date'  => $lot['expiration_date'] ?? null,
                    ]);
                }
            }
        });

        return redirect()->route('commandes.index')->with('success', 'Commande mise à jour avec succès.');
    }

    public function destroy(Commande $commande): RedirectResponse
    {
        if ($commande->status === 'valide') {
            return back()->with('error', 'Une commande validée ne peut pas être supprimée.');
        }

        $commande->delete();

        return redirect()->route('commandes.index')->with('success', 'Commande supprimée avec succès.');
    }

    /**
     * Validate the order (does not touch stock)
     */
    public function valider(Commande $commande): RedirectResponse
    {
        if ($commande->status === 'valide') {
            return redirect()->route('commandes.index')->with('error', 'Cette commande est déjà validée.');
        }

        $commande->status = 'valide';
        $commande->save();

        return redirect()->route('commandes.index')->with('success', 'Commande validée avec succès !');
    }

    /**
     * Get available lots for a product in a warehouse (including those with 0 stock)
     */
    public function getLots(Request $request)
    {
        $productId = $request->query('product_id');
        $entrepotId = $request->query('entrepot_id');

        if (!$productId || !$entrepotId) {
            return response()->json([]);
        }

        $productEntrepot = ProductEntrepot::findProductEntrepot((int) $productId, (int) $entrepotId);

        if (!$productEntrepot) {
            return response()->json([]);
        }

        // Return lots with non-negative quantity so 0 stock is fetched and can be deleted
        $lots = ProductLot::where('entrepot_product_id', $productEntrepot->id)
            ->where('quantity', '>=', 0)
            ->orderBy('expiration_date', 'asc')
            ->get(['id', 'lot_number', 'quantity', 'fabrication_date', 'expiration_date']);

        return response()->json($lots);
    }

    /**
     * Delete a product lot from database if quantity is 0
     */
    public function deleteLot($id)
    {
        $lot = ProductLot::find($id);
        if (!$lot) {
            return response()->json(['success' => false, 'message' => 'Lot non trouvé.'], 404);
        }

        if ((double)$lot->quantity > 0.0001) {
            return response()->json(['success' => false, 'message' => 'Impossible de supprimer un lot qui a du stock restant.'], 400);
        }

        $lot->delete();
        return response()->json(['success' => true, 'message' => 'Lot supprimé de la base de données avec succès.']);
    }

    /**
     * Update commande status dynamically
     */
    public function updateStatus(Request $request, Commande $commande): RedirectResponse
    {
        $request->validate([
            'status' => ['required', 'string', 'in:brouillon,valide,annule'],
        ]);

        $commande->update([
            'status' => $request->input('status'),
        ]);

        return back()->with('success', 'Statut de la commande mis à jour.');
    }
}
