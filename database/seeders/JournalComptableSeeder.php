<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use Illuminate\Support\Facades\Schema;
use App\Models\JournalComptable;
use App\Models\NatureCompte;
use App\Models\PlanComptable;

class JournalComptableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Schema::disableForeignKeyConstraints();
        JournalComptable::truncate();
        Schema::enableForeignKeyConstraints();

        $natures = NatureCompte::all()->keyBy('code');
        $planComptes = PlanComptable::all()->keyBy('numero');

        $journaux = [
            [
                'code' => 'ACH',
                'libelle' => 'Journal des Achats',
                'nature_compte_id' => $natures->get('ACH')?->id,
                'compte_contrepartie_id' => null,
            ],
            [
                'code' => 'VEN',
                'libelle' => 'Journal des Ventes',
                'nature_compte_id' => $natures->get('VTE')?->id,
                'compte_contrepartie_id' => null,
            ],
            [
                'code' => 'BQ1',
                'libelle' => 'Banque BMCE',
                'nature_compte_id' => $natures->get('TRS')?->id,
                'compte_contrepartie_id' => $planComptes->get('5141')?->id,
            ],
            [
                'code' => 'CAI',
                'libelle' => 'Caisse Principale',
                'nature_compte_id' => $natures->get('TRS')?->id,
                'compte_contrepartie_id' => $planComptes->get('5161')?->id,
            ],
            [
                'code' => 'OD',
                'libelle' => 'Opérations Diverses',
                'nature_compte_id' => $natures->get('OD')?->id,
                'compte_contrepartie_id' => null,
            ],
            [
                'code' => 'SAL',
                'libelle' => 'Journal des Salaires',
                'nature_compte_id' => $natures->get('OD')?->id,
                'compte_contrepartie_id' => null,
            ],
            [
                'code' => 'TVA',
                'libelle' => 'Opérations de TVA',
                'nature_compte_id' => $natures->get('OD')?->id,
                'compte_contrepartie_id' => null,
            ],
            [
                'code' => 'AMO',
                'libelle' => 'Dotations aux Amortissements',
                'nature_compte_id' => $natures->get('OD')?->id,
                'compte_contrepartie_id' => null,
            ],
            [
                'code' => 'AN',
                'libelle' => 'À Nouveaux',
                'nature_compte_id' => $natures->get('RAN')?->id,
                'compte_contrepartie_id' => null,
            ],
        ];

        foreach ($journaux as $journal) {
            JournalComptable::create($journal);
        }
    }
}
