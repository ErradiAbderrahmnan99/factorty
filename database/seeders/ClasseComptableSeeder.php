<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use App\Models\ClasseComptable;

class ClasseComptableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $classes = [
            ['numero' => '1', 'libelle' => 'Comptes de capitaux', 'nature' => 'Bilan - Passif'],
            ['numero' => '2', 'libelle' => 'Comptes d\'immobilisations', 'nature' => 'Bilan - Actif'],
            ['numero' => '3', 'libelle' => 'Comptes de stocks et en-cours', 'nature' => 'Bilan - Actif'],
            ['numero' => '4', 'libelle' => 'Comptes de tiers', 'nature' => 'Bilan'],
            ['numero' => '5', 'libelle' => 'Comptes financiers', 'nature' => 'Bilan'],
            ['numero' => '6', 'libelle' => 'Comptes de charges', 'nature' => 'Gestion - Charge'],
            ['numero' => '7', 'libelle' => 'Comptes de produits', 'nature' => 'Gestion - Produit'],
            ['numero' => '8', 'libelle' => 'Comptes spéciaux', 'nature' => 'Spécial'],
            ['numero' => '9', 'libelle' => 'Comptes analytiques', 'nature' => 'Analytique'],
        ];

        foreach ($classes as $classe) {
            ClasseComptable::firstOrCreate(['numero' => $classe['numero']], $classe);
        }
    }
}
