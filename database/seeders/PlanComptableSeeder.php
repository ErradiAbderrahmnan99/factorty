<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use App\Models\PlanComptable;
use App\Models\ClasseComptable;

class PlanComptableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Schema::disableForeignKeyConstraints();
        PlanComptable::truncate();
        Schema::enableForeignKeyConstraints();

        $classes = ClasseComptable::all()->keyBy('numero');

        $comptes = [
            // Class 1: Capitaux
            ['numero' => '1111', 'libelle' => 'Capital social', 'sens' => 'credit', 'collectif' => false],
            ['numero' => '1191', 'libelle' => 'Report à nouveau (créditeur)', 'sens' => 'credit', 'collectif' => false],
            ['numero' => '1199', 'libelle' => 'Report à nouveau (débiteur)', 'sens' => 'debit', 'collectif' => false],

            // Class 2: Immobilisations
            ['numero' => '2111', 'libelle' => 'Frais de constitution', 'sens' => 'debit', 'collectif' => false],
            ['numero' => '2321', 'libelle' => 'Bâtiments', 'sens' => 'debit', 'collectif' => false],
            ['numero' => '2330', 'libelle' => 'Installations techniques, matériel et outillage', 'sens' => 'debit', 'collectif' => false],
            ['numero' => '2340', 'libelle' => 'Matériel de transport', 'sens' => 'debit', 'collectif' => false],
            ['numero' => '2351', 'libelle' => 'Mobilier de bureau', 'sens' => 'debit', 'collectif' => false],
            ['numero' => '2352', 'libelle' => 'Matériel de bureau', 'sens' => 'debit', 'collectif' => false],
            ['numero' => '2355', 'libelle' => 'Matériel informatique', 'sens' => 'debit', 'collectif' => false],

            // Class 3: Stocks, Clients & TVA Récupérable
            ['numero' => '3111', 'libelle' => 'Marchandises', 'sens' => 'debit', 'collectif' => false],
            ['numero' => '3121', 'libelle' => 'Matières premières', 'sens' => 'debit', 'collectif' => false],
            ['numero' => '3421', 'libelle' => 'Clients', 'sens' => 'debit', 'collectif' => true],
            ['numero' => '34551', 'libelle' => 'État - TVA récupérable sur immobilisations', 'sens' => 'debit', 'collectif' => false],
            ['numero' => '34552', 'libelle' => 'État - TVA récupérable sur charges', 'sens' => 'debit', 'collectif' => false],

            // Class 4: Fournisseurs, Social & TVA Facturée
            ['numero' => '4411', 'libelle' => 'Fournisseurs', 'sens' => 'credit', 'collectif' => true],
            ['numero' => '4455', 'libelle' => 'État - TVA facturée', 'sens' => 'credit', 'collectif' => false],
            ['numero' => '4432', 'libelle' => 'Rémunérations dues au personnel', 'sens' => 'credit', 'collectif' => false],

            // Class 5: Financiers (Trésorerie)
            ['numero' => '5141', 'libelle' => 'Banque BMCE', 'sens' => 'mixte', 'collectif' => false],
            ['numero' => '5142', 'libelle' => 'Banque Attijariwafa', 'sens' => 'mixte', 'collectif' => false],
            ['numero' => '5161', 'libelle' => 'Caisse Principale', 'sens' => 'mixte', 'collectif' => false],

            // Class 6: Charges (Dépenses)
            ['numero' => '6111', 'libelle' => 'Achats de marchandises', 'sens' => 'debit', 'collectif' => false],
            ['numero' => '6121', 'libelle' => 'Achats de matières premières', 'sens' => 'debit', 'collectif' => false],
            ['numero' => '6122', 'libelle' => 'Achats de matières et fournitures consommables', 'sens' => 'debit', 'collectif' => false],
            ['numero' => '6125', 'libelle' => 'Achats non stockés de matières et fournitures', 'sens' => 'debit', 'collectif' => false],
            ['numero' => '6131', 'libelle' => 'Locations', 'sens' => 'debit', 'collectif' => false],
            ['numero' => '6134', 'libelle' => 'Primes d\'assurances', 'sens' => 'debit', 'collectif' => false],
            ['numero' => '6141', 'libelle' => 'Études, recherches et documentation', 'sens' => 'debit', 'collectif' => false],
            ['numero' => '6142', 'libelle' => 'Transports', 'sens' => 'debit', 'collectif' => false],
            ['numero' => '6143', 'libelle' => 'Déplacements, missions et réceptions', 'sens' => 'debit', 'collectif' => false],
            ['numero' => '6144', 'libelle' => 'Publicité, publications et relations publiques', 'sens' => 'debit', 'collectif' => false],
            ['numero' => '6145', 'libelle' => 'Frais postaux et de télécommunications', 'sens' => 'debit', 'collectif' => false],
            ['numero' => '6147', 'libelle' => 'Services bancaires', 'sens' => 'debit', 'collectif' => false],

            // Class 7: Produits (Recettes)
            ['numero' => '7111', 'libelle' => 'Ventes de marchandises', 'sens' => 'credit', 'collectif' => false],
            ['numero' => '7121', 'libelle' => 'Ventes de biens produits', 'sens' => 'credit', 'collectif' => false],
            ['numero' => '7124', 'libelle' => 'Ventes de services produits', 'sens' => 'credit', 'collectif' => false],
        ];

        foreach ($comptes as $compte) {
            $firstDigit = substr($compte['numero'], 0, 1);
            $classe = $classes->get($firstDigit);

            if ($classe) {
                PlanComptable::create([
                    'numero' => $compte['numero'],
                    'libelle' => $compte['libelle'],
                    'classe_id' => $classe->id,
                    'sens' => $compte['sens'],
                    'collectif' => $compte['collectif'],
                    'actif' => true,
                ]);
            }
        }
    }
}
