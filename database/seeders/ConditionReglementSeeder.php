<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ConditionReglement;

class ConditionReglementSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $conditionsReglement = [
            [
                'id' => 1,
                'label' => '120 jours date facture',
                'code' => 'NET120',
                'label_long' => 'Paiement à 120 jours à partir de la date de facture',
            ],
            [
                'id' => 2,
                'label' => '30 jours date facture',
                'code' => 'NET30',
                'label_long' => 'Paiement à 30 jours à partir de la date de facture',
            ],
            [
                'id' => 3,
                'label' => '30 jours fin de mois',
                'code' => 'EOM30',
                'label_long' => 'Paiement à 30 jours fin de mois',
            ],
            [
                'id' => 4,
                'label' => '60 jours date facture',
                'code' => 'NET60',
                'label_long' => 'Paiement à 60 jours à partir de la date de facture',
            ],
            [
                'id' => 5,
                'label' => '60 jours fin de mois',
                'code' => 'EOM60',
                'label_long' => 'Paiement à 60 jours fin de mois',
            ],
            [
                'id' => 6,
                'label' => 'Comptant',
                'code' => 'CASH',
                'label_long' => 'Paiement comptant',
            ],
            [
                'id' => 7,
                'label' => '50/50',
                'code' => 'HALF',
                'label_long' => 'Paiement en deux parties : 50% à la commande, 50% à la livraison',
            ],
            [
                'id' => 8,
                'label' => '90 jours fin du mois',
                'code' => 'EOM90',
                'label_long' => 'Paiement à 90 jours fin du mois',
            ],
            [
                'id' => 9,
                'label' => '90 jours date facture',
                'code' => 'NET90',
                'label_long' => 'Paiement à 90 jours à partir de la date de facture',
            ],
            [
                'id' => 10,
                'label' => '120 jours fin du mois',
                'code' => 'EOM120',
                'label_long' => 'Paiement à 120 jours fin du mois',
            ],
        ];

        foreach ($conditionsReglement as $cond) {
            ConditionReglement::updateOrCreate(['id' => $cond['id']], $cond);
        }
    }
}
