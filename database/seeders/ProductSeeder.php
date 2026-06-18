<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ProductCategory;
use App\Models\UnitCategory;
use App\Models\Unit;
use App\Models\Product;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $catElec = ProductCategory::where('code', 'CAT-ELEC')->first();
        $catMeca = ProductCategory::where('code', 'CAT-MECA')->first();
        $catChim = ProductCategory::where('code', 'CAT-CHIM')->first();
        $catEmba = ProductCategory::where('code', 'CAT-EMBA')->first();

        $massCat = UnitCategory::where('code', 'UNIT-MASS')->first();
        $lenCat = UnitCategory::where('code', 'UNIT-LEN')->first();
        $volCat = UnitCategory::where('code', 'UNIT-VOL')->first();

        $uKg = Unit::where('code', 'KG')->first();
        $uG = Unit::where('code', 'G')->first();
        $uM = Unit::where('code', 'M')->first();
        $uCm = Unit::where('code', 'CM')->first();
        $uL = Unit::where('code', 'L')->first();
        $uMl = Unit::where('code', 'ML')->first();

        if (!$catElec || !$catMeca || !$catChim || !$catEmba || !$massCat || !$lenCat || !$volCat) {
            return;
        }

        $products = [
            [
                'product_category_id' => $catElec->id,
                'ref' => 'PRD-ARD-UNO',
                'label' => 'Carte Arduino Uno Rev3',
                'unit_category_id' => $massCat->id,
                'stock_unit_id' => $uG->id,
                'purchase_unit_id' => $uG->id,
                'sale_unit_id' => $uG->id,
                'length' => 68.6,
                'width' => 53.4,
                'height' => 15.0,
                'stock_limit' => 10.0,
                'purchase_price' => 150.00,
                'sale_price' => 250.00,
                'status' => 'actif',
            ],
            [
                'product_category_id' => $catElec->id,
                'ref' => 'PRD-CAP-ULT',
                'label' => 'Capteur Ultrason HC-SR04',
                'unit_category_id' => $massCat->id,
                'stock_unit_id' => $uG->id,
                'purchase_unit_id' => $uG->id,
                'sale_unit_id' => $uG->id,
                'length' => 45.0,
                'width' => 20.0,
                'height' => 15.0,
                'stock_limit' => 25.0,
                'purchase_price' => 15.00,
                'sale_price' => 35.00,
                'status' => 'actif',
            ],
            [
                'product_category_id' => $catElec->id,
                'ref' => 'PRD-CAB-JMP',
                'label' => 'Câble Jumper 20cm (x40)',
                'unit_category_id' => $lenCat->id,
                'stock_unit_id' => $uCm->id,
                'purchase_unit_id' => $uCm->id,
                'sale_unit_id' => $uCm->id,
                'length' => 20.0,
                'width' => 1.0,
                'height' => 1.0,
                'stock_limit' => 50.0,
                'purchase_price' => 8.50,
                'sale_price' => 19.90,
                'status' => 'actif',
            ],
            [
                'product_category_id' => $catMeca->id,
                'ref' => 'PRD-ENG-40D',
                'label' => 'Engrenage Droit 40 Dents',
                'unit_category_id' => $massCat->id,
                'stock_unit_id' => $uG->id,
                'purchase_unit_id' => $uG->id,
                'sale_unit_id' => $uG->id,
                'length' => 42.0,
                'width' => 42.0,
                'height' => 8.0,
                'stock_limit' => 15.0,
                'purchase_price' => 45.00,
                'sale_price' => 89.00,
                'status' => 'actif',
            ],
            [
                'product_category_id' => $catMeca->id,
                'ref' => 'PRD-VIS-M4',
                'label' => 'Vis M4 x 16mm (x100)',
                'unit_category_id' => $massCat->id,
                'stock_unit_id' => $uG->id,
                'purchase_unit_id' => $uG->id,
                'sale_unit_id' => $uG->id,
                'length' => 16.0,
                'width' => 4.0,
                'height' => 4.0,
                'stock_limit' => 100.0,
                'purchase_price' => 12.00,
                'sale_price' => 25.00,
                'status' => 'actif',
            ],
            [
                'product_category_id' => $catMeca->id,
                'ref' => 'PRD-ARB-8MM',
                'label' => 'Arbre de Transmission 8mm',
                'unit_category_id' => $lenCat->id,
                'stock_unit_id' => $uM->id,
                'purchase_unit_id' => $uM->id,
                'sale_unit_id' => $uM->id,
                'length' => 1.0,
                'width' => 0.008,
                'height' => 0.008,
                'stock_limit' => 5.0,
                'purchase_price' => 75.00,
                'sale_price' => 150.00,
                'status' => 'actif',
            ],
            [
                'product_category_id' => $catChim->id,
                'ref' => 'PRD-RES-EPO',
                'label' => 'Résine Époxy Transparente 1L',
                'unit_category_id' => $volCat->id,
                'stock_unit_id' => $uL->id,
                'purchase_unit_id' => $uL->id,
                'sale_unit_id' => $uL->id,
                'stock_limit' => 10.0,
                'purchase_price' => 180.00,
                'sale_price' => 290.00,
                'status' => 'actif',
            ],
            [
                'product_category_id' => $catChim->id,
                'ref' => 'PRD-SOL-DEG',
                'label' => 'Solvant Dégraissant 500ml',
                'unit_category_id' => $volCat->id,
                'stock_unit_id' => $uMl->id,
                'purchase_unit_id' => $uMl->id,
                'sale_unit_id' => $uMl->id,
                'stock_limit' => 20.0,
                'purchase_price' => 35.00,
                'sale_price' => 65.00,
                'status' => 'actif',
            ],
            [
                'product_category_id' => $catEmba->id,
                'ref' => 'PRD-CRT-A4',
                'label' => 'Carton Emballage A4',
                'unit_category_id' => $massCat->id,
                'stock_unit_id' => $uG->id,
                'purchase_unit_id' => $uG->id,
                'sale_unit_id' => $uG->id,
                'length' => 310.0,
                'width' => 220.0,
                'height' => 150.0,
                'stock_limit' => 500.0,
                'purchase_price' => 1.80,
                'sale_price' => 4.50,
                'status' => 'actif',
            ],
            [
                'product_category_id' => $catEmba->id,
                'ref' => 'PRD-FLM-BUL',
                'label' => 'Film Bulle Rouleau 50m',
                'unit_category_id' => $lenCat->id,
                'stock_unit_id' => $uM->id,
                'purchase_unit_id' => $uM->id,
                'sale_unit_id' => $uM->id,
                'length' => 50.0,
                'stock_limit' => 5.0,
                'purchase_price' => 120.00,
                'sale_price' => 220.00,
                'status' => 'actif',
            ],
            [
                'product_category_id' => $catEmba->id,
                'ref' => 'PRD-PAL-STD',
                'label' => 'Palette Bois standard',
                'unit_category_id' => $massCat->id,
                'stock_unit_id' => $uKg->id,
                'purchase_unit_id' => $uKg->id,
                'sale_unit_id' => $uKg->id,
                'length' => 1200.0,
                'width' => 800.0,
                'height' => 144.0,
                'stock_limit' => 50.0,
                'purchase_price' => 60.00,
                'sale_price' => 120.00,
                'status' => 'inactif',
            ],
            [
                'product_category_id' => $catEmba->id,
                'ref' => 'PRD-RUB-ADH',
                'label' => 'Ruban Adhésif Polypropylène',
                'unit_category_id' => $lenCat->id,
                'stock_unit_id' => $uM->id,
                'purchase_unit_id' => $uM->id,
                'sale_unit_id' => $uM->id,
                'length' => 66.0,
                'stock_limit' => 100.0,
                'purchase_price' => 2.50,
                'sale_price' => 5.50,
                'status' => 'actif',
            ],
        ];

        foreach ($products as $p) {
            Product::updateOrCreate(['ref' => $p['ref']], $p);
        }
    }
}
