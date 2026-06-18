<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ModeReglement;
use App\Models\StatutReglement;

class ReglementSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $modes = [
            'Chèque' => [
                ['label' => 'Brouillon', 'is_banque' => false],
                ['label' => 'Reçu', 'is_banque' => false],
                ['label' => 'Déposé', 'is_banque' => false],
                ['label' => 'Encaissé', 'is_banque' => true],
                ['label' => 'Rejeté', 'is_banque' => true],
            ],
            'Virement' => [
                ['label' => 'En attente', 'is_banque' => false],
                ['label' => 'Exécuté / Reçu', 'is_banque' => true],
            ],
            'Espèces' => [
                ['label' => 'Reçu', 'is_banque' => false],
                ['label' => 'Déposé en caisse', 'is_banque' => false],
                ['label' => 'Encaissé', 'is_banque' => true],
            ],
            'Effet de commerce' => [
                ['label' => 'Reçu', 'is_banque' => false],
                ['label' => 'Déposé en banque', 'is_banque' => true],
            ],
        ];

        foreach ($modes as $modeLabel => $statuses) {
            $m = ModeReglement::firstOrCreate(['label' => $modeLabel]);
            foreach ($statuses as $st) {
                StatutReglement::updateOrCreate(
                    ['label' => $st['label'], 'mode_reglement_id' => $m->id],
                    ['is_banque' => $st['is_banque']]
                );
            }
        }
    }
}
