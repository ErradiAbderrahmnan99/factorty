<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Entrepot;
use App\Models\Product;
use App\Models\ProductEntrepot;
use App\Models\ProductLot;

class StockTestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Create Test Warehouses
        $ent1 = Entrepot::updateOrCreate(
            ['code' => 'WH-CAS-MAIN'],
            [
                'label' => 'Entrepôt Principal Casablanca',
                'address' => 'Boulevard Mcdonald, Casablanca',
                'parent_id' => null,
                'assign_to' => null,
            ]
        );

        $ent2 = Entrepot::updateOrCreate(
            ['code' => 'WH-BOU-AUX'],
            [
                'label' => 'Entrepôt Auxiliaire Bouskoura',
                'address' => 'Zone Industrielle Bouskoura, Casablanca',
                'parent_id' => $ent1->id,
                'assign_to' => null,
            ]
        );

        // 2. Configure Products
        // Product 1: Manage by lot
        $pResin = Product::where('ref', 'PRD-RES-EPO')->first();
        if ($pResin) {
            $pResin->update([
                'manage_by_lot' => true,
                'stock_negative' => false,
            ]);

            // Link to Main Warehouse & Add Expiration-aware Lots
            $peResin = ProductEntrepot::updateOrCreate(
                [
                    'entrepot_id' => $ent1->id,
                    'product_id' => $pResin->id,
                ],
                [
                    'quantity' => 150.0000,
                ]
            );

            // Add Lots
            $lots = [
                [
                    'lot_number' => 'LOT-2026-RES01',
                    'quantity' => 50.0000,
                    'fabrication_date' => '2026-05-01',
                    'expiration_date' => '2027-05-01',
                ],
                [
                    'lot_number' => 'LOT-2026-RES02',
                    'quantity' => 70.0000,
                    'fabrication_date' => '2026-05-15',
                    'expiration_date' => '2027-05-15',
                ],
                [
                    'lot_number' => 'LOT-2026-RES03',
                    'quantity' => 30.0000,
                    'fabrication_date' => '2026-05-20',
                    'expiration_date' => '2026-12-20',
                ],
            ];

            foreach ($lots as $lot) {
                ProductLot::updateOrCreate(
                    [
                        'entrepot_product_id' => $peResin->id,
                        'lot_number' => $lot['lot_number'],
                    ],
                    $lot
                );
            }
        }

        // Product 2: Standard stock (no lots, no negative stock)
        $pScrews = Product::where('ref', 'PRD-VIS-M4')->first();
        if ($pScrews) {
            $pScrews->update([
                'manage_by_lot' => false,
                'stock_negative' => false,
            ]);

            ProductEntrepot::updateOrCreate(
                [
                    'entrepot_id' => $ent1->id,
                    'product_id' => $pScrews->id,
                ],
                [
                    'quantity' => 1200.0000,
                ]
            );
        }

        // Product 3: Standard stock allowing negative inventory
        $pFilm = Product::where('ref', 'PRD-FLM-BUL')->first();
        if ($pFilm) {
            $pFilm->update([
                'manage_by_lot' => false,
                'stock_negative' => true,
            ]);

            ProductEntrepot::updateOrCreate(
                [
                    'entrepot_id' => $ent1->id,
                    'product_id' => $pFilm->id,
                ],
                [
                    'quantity' => 0.0000, // Starts at 0
                ]
            );
        }
    }
}
