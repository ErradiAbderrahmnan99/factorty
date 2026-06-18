<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            AdminUserSeeder::class,
            ProductCategorySeeder::class,
            UnitSeeder::class,
            ProductSeeder::class,
            LocationSeeder::class,
            TierSeeder::class,
            TypeApprobateurSeeder::class,
            DeviseSeeder::class,
            ReglementSeeder::class,
            ConditionReglementSeeder::class,
            ClasseComptableSeeder::class,
            PlanComptableSeeder::class,
            NatureCompteSeeder::class,
            JournalComptableSeeder::class,
            StockTestSeeder::class,
        ]);
    }
}
