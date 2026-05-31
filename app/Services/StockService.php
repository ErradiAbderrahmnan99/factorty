<?php

namespace App\Services;

use App\Models\Commande;
use App\Models\Livraison;
use App\Models\ProductEntrepot;
use App\Models\ProductLot;
use Illuminate\Support\Facades\DB;
use Exception;

class StockService
{
    /**
     * Validate and deduct stock for a validated Commande.
     * Runs inside a DB transaction to ensure atomic execution.
     *
     * @param Commande $commande
     * @return array
     */
    public function validateAndDeductStock(Commande $commande): array
    {
        return DB::transaction(function () use ($commande) {
            try {
                // Ensure the order is not already validated or processed
                if ($commande->status === 'valide') {
                    return [
                        'status' => false,
                        'message' => 'Cette commande est déjà validée et le stock a été déduit.',
                    ];
                }

                foreach ($commande->lines as $line) {
                    $product = $line->product;
                    $entrepotId = $line->entrepot_id;
                    $requestedQty = (float) $line->qty;

                    if ($product->manage_by_lot) {
                        $lineLots = $line->lots;

                        if ($lineLots->isEmpty()) {
                            throw new Exception("Le produit '{$product->label}' est géré par lot, mais aucun lot n'a été sélectionné.");
                        }

                        // Verify that sum of allocated lots matches line item quantity (both in line unit)
                        $allocatedSum = 0.0;
                        foreach ($lineLots as $ll) {
                            $allocatedSum += (float) $ll->quantity;
                        }

                        if (abs($allocatedSum - $requestedQty) > 0.0001) {
                            throw new Exception("La quantité cumulée des lots ({$allocatedSum}) ne correspond pas à la quantité demandée ({$requestedQty}) pour le produit '{$product->label}'.");
                        }

                        // Retrieve or create the pivot record
                        $productEntrepot = ProductEntrepot::findProductEntrepot($product->id, $entrepotId);
                        if (!$productEntrepot) {
                            // If it doesn't exist, we have 0 stock, which is insufficient for any positive lot extraction
                            throw new Exception("Stock insuffisant : le produit '{$product->label}' n'est pas stocké dans l'entrepôt sélectionné.");
                        }

                        // Validate and deduct each lot
                        foreach ($lineLots as $lineLot) {
                            $warehouseLot = ProductLot::where('entrepot_product_id', $productEntrepot->id)
                                ->where('lot_number', $lineLot->lot_number)
                                ->first();

                            $availableLotQty = $warehouseLot ? (float) $warehouseLot->quantity : 0.0;
                            
                            // Convert the lot's quantity from the line unit to the product's warehouse stock unit
                            $neededLotQty = (float) $lineLot->quantity;
                            $neededLotQtyConverted = $this->convertToStockUnit($neededLotQty, $line->sale_unit_id, $product);

                            if ($availableLotQty < $neededLotQtyConverted) {
                                $lineUnitCode = $line->saleUnit ? $line->saleUnit->code : 'unité';
                                $stockUnitCode = $product->stockUnit ? $product->stockUnit->code : 'unité';
                                throw new Exception("Stock insuffisant pour le lot '{$lineLot->lot_number}' du produit '{$product->label}' (Disponible: {$availableLotQty} {$stockUnitCode}, Demandé: {$neededLotQty} {$lineUnitCode} equivalent à {$neededLotQtyConverted} {$stockUnitCode}).");
                            }

                            // Deduct converted lot quantity
                            $warehouseLot->quantity -= $neededLotQtyConverted;
                            $warehouseLot->save();

                            // Deduct general warehouse pivot quantity
                            $productEntrepot->quantity -= $neededLotQtyConverted;
                        }

                        $productEntrepot->save();

                    } else {
                        // Standard product without lots
                        $productEntrepot = ProductEntrepot::findProductEntrepot($product->id, $entrepotId);

                        // Convert requested quantity from line unit to product stock unit
                        $requestedQtyConverted = $this->convertToStockUnit($requestedQty, $line->sale_unit_id, $product);

                        if (!$productEntrepot) {
                            if (!$product->stock_negative) {
                                $lineUnitCode = $line->saleUnit ? $line->saleUnit->code : 'unité';
                                $stockUnitCode = $product->stockUnit ? $product->stockUnit->code : 'unité';
                                throw new Exception("Stock insuffisant pour le produit '{$product->label}' dans l'entrepôt sélectionné (Disponible: 0 {$stockUnitCode}, Demandé: {$requestedQty} {$lineUnitCode} equivalent à {$requestedQtyConverted} {$stockUnitCode}).");
                            }
                            
                            // If negative stock allowed, create the record with a starting quantity of 0
                            $productEntrepot = ProductEntrepot::createProductEntrepot($product->id, $entrepotId, 0.0);
                        }

                        $currentQty = (float) $productEntrepot->quantity;

                        if ($currentQty < $requestedQtyConverted && !$product->stock_negative) {
                            $lineUnitCode = $line->saleUnit ? $line->saleUnit->code : 'unité';
                            $stockUnitCode = $product->stockUnit ? $product->stockUnit->code : 'unité';
                            throw new Exception("Stock insuffisant pour le produit '{$product->label}' dans l'entrepôt sélectionné (Disponible: {$currentQty} {$stockUnitCode}, Demandé: {$requestedQty} {$lineUnitCode} equivalent à {$requestedQtyConverted} {$stockUnitCode}).");
                        }

                        // Deduct converted quantity from warehouse general stock
                        $productEntrepot->quantity -= $requestedQtyConverted;
                        $productEntrepot->save();
                    }
                }

                // Update Commande status to 'valide'
                $commande->status = 'valide';
                $commande->save();

                return [
                    'status' => true,
                    'message' => 'Commande validée et stock déduit avec succès !',
                ];

            } catch (Exception $e) {
                // The transaction will roll back automatically on exception
                return [
                    'status' => false,
                    'message' => $e->getMessage(),
                ];
            }
        });
    }

    /**
     * Validate and deduct stock for a validated Livraison.
     * Runs inside a DB transaction to ensure atomic execution.
     *
     * @param Livraison $livraison
     * @return array
     */
    public function validateAndDeductStockForLivraison(Livraison $livraison): array
    {
        return DB::transaction(function () use ($livraison) {
            try {
                if ($livraison->status === 'valide') {
                    return [
                        'status' => false,
                        'message' => 'Cette livraison est déjà validée et le stock a été déduit.',
                    ];
                }

                foreach ($livraison->lines as $line) {
                    $product = $line->product;
                    $entrepotId = $line->entrepot_id;
                    $requestedQty = (float) $line->qty;

                    if ($product->manage_by_lot) {
                        $lineLots = $line->lots;

                        if ($lineLots->isEmpty()) {
                            throw new Exception("Le produit '{$product->label}' est géré par lot, mais aucun lot n'a été sélectionné.");
                        }

                        // Verify that sum of allocated lots matches line item quantity (both in line unit)
                        $allocatedSum = 0.0;
                        foreach ($lineLots as $ll) {
                            $allocatedSum += (float) $ll->quantity;
                        }

                        if (abs($allocatedSum - $requestedQty) > 0.0001) {
                            throw new Exception("La quantité cumulée des lots ({$allocatedSum}) ne correspond pas à la quantité demandée ({$requestedQty}) pour le produit '{$product->label}'.");
                        }

                        // Retrieve or create the pivot record
                        $productEntrepot = ProductEntrepot::findProductEntrepot($product->id, $entrepotId);
                        if (!$productEntrepot) {
                            throw new Exception("Stock insuffisant : le produit '{$product->label}' n'est pas stocké dans l'entrepôt sélectionné.");
                        }

                        // Validate and deduct each lot
                        foreach ($lineLots as $lineLot) {
                            $warehouseLot = ProductLot::where('entrepot_product_id', $productEntrepot->id)
                                ->where('lot_number', $lineLot->lot_number)
                                ->first();

                            $availableLotQty = $warehouseLot ? (float) $warehouseLot->quantity : 0.0;
                            
                            // Convert the lot's quantity from the line unit to the product's warehouse stock unit
                            $neededLotQty = (float) $lineLot->quantity;
                            $neededLotQtyConverted = $this->convertToStockUnit($neededLotQty, $line->sale_unit_id, $product);

                            if ($availableLotQty < $neededLotQtyConverted) {
                                $lineUnitCode = $line->saleUnit ? $line->saleUnit->code : 'unité';
                                $stockUnitCode = $product->stockUnit ? $product->stockUnit->code : 'unité';
                                throw new Exception("Stock insuffisant pour le lot '{$lineLot->lot_number}' du produit '{$product->label}' (Disponible: {$availableLotQty} {$stockUnitCode}, Demandé: {$neededLotQty} {$lineUnitCode} equivalent à {$neededLotQtyConverted} {$stockUnitCode}).");
                            }

                            // Deduct converted lot quantity
                            $warehouseLot->quantity -= $neededLotQtyConverted;
                            $warehouseLot->save();

                            // Deduct general warehouse pivot quantity
                            $productEntrepot->quantity -= $neededLotQtyConverted;
                        }

                        $productEntrepot->save();

                    } else {
                        // Standard product without lots
                        $productEntrepot = ProductEntrepot::findProductEntrepot($product->id, $entrepotId);

                        // Convert requested quantity from line unit to product stock unit
                        $requestedQtyConverted = $this->convertToStockUnit($requestedQty, $line->sale_unit_id, $product);

                        if (!$productEntrepot) {
                            if (!$product->stock_negative) {
                                $lineUnitCode = $line->saleUnit ? $line->saleUnit->code : 'unité';
                                $stockUnitCode = $product->stockUnit ? $product->stockUnit->code : 'unité';
                                throw new Exception("Stock insuffisant pour le produit '{$product->label}' dans l'entrepôt sélectionné (Disponible: 0 {$stockUnitCode}, Demandé: {$requestedQty} {$lineUnitCode} equivalent à {$requestedQtyConverted} {$stockUnitCode}).");
                            }
                            
                            // If negative stock allowed, create the record with a starting quantity of 0
                            $productEntrepot = ProductEntrepot::createProductEntrepot($product->id, $entrepotId, 0.0);
                        }

                        $currentQty = (float) $productEntrepot->quantity;

                        if ($currentQty < $requestedQtyConverted && !$product->stock_negative) {
                            $lineUnitCode = $line->saleUnit ? $line->saleUnit->code : 'unité';
                            $stockUnitCode = $product->stockUnit ? $product->stockUnit->code : 'unité';
                            throw new Exception("Stock insuffisant pour le produit '{$product->label}' dans l'entrepôt sélectionné (Disponible: {$currentQty} {$stockUnitCode}, Demandé: {$requestedQty} {$lineUnitCode} equivalent à {$requestedQtyConverted} {$stockUnitCode}).");
                        }

                        // Deduct converted quantity from warehouse general stock
                        $productEntrepot->quantity -= $requestedQtyConverted;
                        $productEntrepot->save();
                    }
                }

                // Update Livraison status to 'valide'
                $livraison->status = 'valide';
                $livraison->save();

                return [
                    'status' => true,
                    'message' => 'Livraison validée et stock déduit avec succès !',
                ];

            } catch (Exception $e) {
                return [
                    'status' => false,
                    'message' => $e->getMessage(),
                ];
            }
        });
    }

    /**
     * Converts a quantity from the selected line sale unit to the product stock unit based on ratios.
     */
    private function convertToStockUnit(float $qty, ?string $lineUnitId, $product): float
    {
        $lineUnitId = $lineUnitId ?: $product->sale_unit_id;

        if (!$lineUnitId || !$product->stock_unit_id || (int) $lineUnitId === (int) $product->stock_unit_id) {
            return $qty;
        }

        $lineUnit = \App\Models\Unit::find($lineUnitId);
        $stockUnit = \App\Models\Unit::find($product->stock_unit_id);

        if ($lineUnit && $stockUnit && (int) $lineUnit->unit_category_id === (int) $stockUnit->unit_category_id) {
            $ratioLine = (float) ($lineUnit->ratio ?: 1.0);
            $ratioStock = (float) ($stockUnit->ratio ?: 1.0);

            if ($ratioStock > 0) {
                return $qty * ($ratioLine / $ratioStock);
            }
        }

        return $qty;
    }
}
