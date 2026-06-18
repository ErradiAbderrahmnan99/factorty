<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ProductCategory;

class ProductCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $productCategories = [
            ['code' => 'CAT-ELEC', 'name' => 'Électronique', 'description' => 'Composants, microcontrôleurs, câbles et appareils électroniques.'],
            ['code' => 'CAT-MECA', 'name' => 'Mécanique', 'description' => 'Engrenages, vis, arbres, supports et pièces mécaniques.'],
            ['code' => 'CAT-CHIM', 'name' => 'Matières Premières / Chimie', 'description' => 'Résines, solvants, peintures et réactifs chimiques.'],
            ['code' => 'CAT-EMBA', 'name' => 'Emballages', 'description' => 'Cartons, palettes, films plastiques et étiquettes.'],
        ];

        foreach ($productCategories as $cat) {
            ProductCategory::updateOrCreate(['code' => $cat['code']], $cat);
        }
    }
}
