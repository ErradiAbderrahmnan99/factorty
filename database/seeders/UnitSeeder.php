<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\UnitCategory;
use App\Models\Unit;

class UnitSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Unit Categories
        $weight = UnitCategory::updateOrCreate(
            ['code' => 'UNIT-MASS'],
            ['label' => 'Masse', 'description' => 'Unités de mesure de poids et masse.']
        );

        $length = UnitCategory::updateOrCreate(
            ['code' => 'UNIT-LEN'],
            ['label' => 'Longueur', 'description' => 'Unités de mesure de distance, longueur et dimensions.']
        );

        $volume = UnitCategory::updateOrCreate(
            ['code' => 'UNIT-VOL'],
            ['label' => 'Volume', 'description' => 'Unités de mesure de contenance liquide et volume gazeux.']
        );

        // Units
        $units = [
            // Masse (Base Unit = Kilogramme)
            [
                'unit_category_id' => $weight->id,
                'code' => 'KG',
                'label' => 'Kilogramme',
                'ratio' => 1.000000,
            ],
            [
                'unit_category_id' => $weight->id,
                'code' => 'G',
                'label' => 'Gramme',
                'ratio' => 0.001000,
            ],
            [
                'unit_category_id' => $weight->id,
                'code' => 'TON',
                'label' => 'Tonne',
                'ratio' => 1000.000000,
            ],
            // Longueur (Base Unit = Mètre)
            [
                'unit_category_id' => $length->id,
                'code' => 'M',
                'label' => 'Mètre',
                'ratio' => 1.000000,
            ],
            [
                'unit_category_id' => $length->id,
                'code' => 'MM',
                'label' => 'Millimètre',
                'ratio' => 0.001000,
            ],
            [
                'unit_category_id' => $length->id,
                'code' => 'CM',
                'label' => 'Centimètre',
                'ratio' => 0.010000,
            ],
            [
                'unit_category_id' => $length->id,
                'code' => 'KM',
                'label' => 'Kilomètre',
                'ratio' => 1000.000000,
            ],
            // Volume (Base Unit = Litre)
            [
                'unit_category_id' => $volume->id,
                'code' => 'L',
                'label' => 'Litre',
                'ratio' => 1.000000,
            ],
            [
                'unit_category_id' => $volume->id,
                'code' => 'ML',
                'label' => 'Millilitre',
                'ratio' => 0.001000,
            ],
        ];

        foreach ($units as $unit) {
            Unit::updateOrCreate(
                ['code' => $unit['code'], 'unit_category_id' => $unit['unit_category_id']],
                $unit
            );
        }
    }
}
