<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use App\Models\NatureCompte;
use App\Models\NatureCompteFourchette;

class NatureCompteSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Schema::disableForeignKeyConstraints();
        NatureCompte::truncate();
        NatureCompteFourchette::truncate();
        Schema::enableForeignKeyConstraints();

        $natures = [
            // ─────────── ACHATS (Exploitation) ───────────
            'ACH' => [
                'libelle' => 'Achats',
                'fourchettes' => [
                    ['debut' => '6111', 'fin' => '6999xxxxxx'], // Achats de marchandises, matières, services
                    ['debut' => '4411', 'fin' => '4418xxxxxx'], // Fournisseurs d'exploitation
                    ['debut' => '3455', 'fin' => '3456xxxxxx'], // État - TVA Récupérable sur charges
                    ['debut' => '3411', 'fin' => '3411xxxxxx'], // Fournisseurs - Avances et acomptes versés
                ]
            ],

            // ─────────── IMMOBILISATIONS (Investissement) ───────────
            'IMM' => [
                'libelle' => 'Immobilisations',
                'fourchettes' => [
                    ['debut' => '2111', 'fin' => '2399xxxxxx'], // Immobilisations incorporelles, corporelles et en cours
                    ['debut' => '4481', 'fin' => '4481xxxxxx'], // Dettes sur acquisitions d'immobilisations (Fournisseur immo)
                    ['debut' => '3455', 'fin' => '3456xxxxxx'], // État - TVA Récupérable sur immobilisations
                ]
            ],

            // ─────────── NOTES DE FRAIS (Dépenses des salariés) ───────────
            'NDF' => [
                'libelle' => 'Notes de Frais',
                'fourchettes' => [
                    ['debut' => '6111', 'fin' => '6999xxxxxx'], // Charges (Missions, déplacements, restaurant, hôtels...)
                    ['debut' => '4432', 'fin' => '4438xxxxxx'], // Personnel (Rémunérations dues au personnel)
                    ['debut' => '3431', 'fin' => '3431xxxxxx'], // Avances au personnel (Pour solder une avance)
                    ['debut' => '3455', 'fin' => '3456xxxxxx'], // État - TVA Récupérable (Sur factures avec TVA)
                ]
            ],

            // ─────────── VENTES ───────────
            'VTE' => [
                'libelle' => 'Ventes',
                'fourchettes' => [
                    ['debut' => '7111', 'fin' => '7999xxxxxx'], // Ventes de biens, services, produits accessoires
                    ['debut' => '3421', 'fin' => '3428xxxxxx'], // Clients
                    ['debut' => '4455', 'fin' => '4455xxxxxx'], // État - TVA Facturée
                    ['debut' => '4421', 'fin' => '4421xxxxxx'], // Clients - Avances et acomptes reçus
                    ['debut' => '3482', 'fin' => '3482xxxxxx'], // Créances sur cessions d'immobilisations
                    ['debut' => '7511', 'fin' => '7519xxxxxx'], // Produits des cessions d'immobilisations
                ]
            ],

            // ─────────── TRÉSORERIE (Banques & Caisses) ───────────
            'TRS' => [
                'libelle' => 'Trésorerie',
                'fourchettes' => [
                    ['debut' => '5111', 'fin' => '5999xxxxxx'], // Comptes de trésorerie (Banque, Caisse, Effets)
                    ['debut' => '1111', 'fin' => '4999xxxxxx'], // Comptes de Bilan (Paiement Fournisseurs, Encaissement Clients, CNSS...)
                    ['debut' => '6111', 'fin' => '7999xxxxxx'], // Charges & Produits directs (Frais bancaires, intérêts, agios...)
                ]
            ],

            // ─────────── OPÉRATIONS DIVERSES (OD) ───────────
            'OD' => [
                'libelle' => 'Opérations Diverses',
                'fourchettes' => [
                    ['debut' => '1111', 'fin' => '9999xxxxxx'], // Autorise toutes les classes (Salaires, Amortissements, TVA...)
                ]
            ],

            // ─────────── REPORT À NOUVEAU (Ouverture) ───────────
            'RAN' => [
                'libelle' => 'Report à Nouveau',
                'fourchettes' => [
                    ['debut' => '1111', 'fin' => '5999xxxxxx'], // Le bilan d'ouverture ne touche QUE les comptes de Bilan (Classes 1 à 5)
                ]
            ],
        ];

        foreach ($natures as $code => $data) {
            $nature = NatureCompte::create([
                'code' => $code,
                'label' => $data['libelle']
            ]);

            foreach ($data['fourchettes'] as $f) {
                $nature->fourchettes()->create($f);
            }
        }
    }
}
