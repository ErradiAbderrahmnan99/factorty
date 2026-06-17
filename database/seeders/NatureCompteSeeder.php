<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use App\Models\NatureCompte;

class NatureCompteSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        \Illuminate\Support\Facades\Schema::disableForeignKeyConstraints();
        NatureCompte::truncate();
        \App\Models\NatureCompteFourchette::truncate();
        \Illuminate\Support\Facades\Schema::enableForeignKeyConstraints();

        $natures = [
            // ─────────── TIERS COMMERCIAUX ───────────
            'Client' => [
                ['debut' => '3421', 'fin' => '3421xxxxxx'], // Clients
                ['debut' => '3423', 'fin' => '3423xxxxxx'], // Clients - Retenues de garantie
                ['debut' => '3424', 'fin' => '3424xxxxxx'], // Clients douteux ou litigieux
                ['debut' => '3425', 'fin' => '3425xxxxxx'], // Clients - Effets à recevoir
                ['debut' => '3427', 'fin' => '3427xxxxxx'], // Clients - Factures à établir
                ['debut' => '3428', 'fin' => '3428xxxxxx'], // Autres clients et comptes rattachés
            ],

            'Fournisseur' => [
                ['debut' => '4411', 'fin' => '4411xxxxxx'], // Fournisseurs
                ['debut' => '4413', 'fin' => '4413xxxxxx'], // Fournisseurs - Retenues de garantie
                ['debut' => '4415', 'fin' => '4415xxxxxx'], // Fournisseurs - Effets à payer
                ['debut' => '4417', 'fin' => '4417xxxxxx'], // Fournisseurs - Factures non parvenues
                ['debut' => '4418', 'fin' => '4418xxxxxx'], // Autres fournisseurs et comptes rattachés
                ['debut' => '3411', 'fin' => '3411xxxxxx'], // Fournisseurs - Avances et acomptes versés
            ],

            // ─────────── PERSONNEL ───────────
            'Salarié' => [
                ['debut' => '3431', 'fin' => '3431xxxxxx'], // Avances et acomptes au personnel
                ['debut' => '4432', 'fin' => '4432xxxxxx'], // Rémunérations dues au personnel
                ['debut' => '4433', 'fin' => '4433xxxxxx'], // Dépôts du personnel créditeurs
                ['debut' => '4434', 'fin' => '4434xxxxxx'], // Oppositions sur salaires
                ['debut' => '4437', 'fin' => '4437xxxxxx'], // Charges de personnel à payer
            ],

            // ─────────── ASSOCIÉS ───────────
            'Associé' => [
                ['debut' => '3461', 'fin' => '3461xxxxxx'], // Associés - Comptes d'apport en société
                ['debut' => '3463', 'fin' => '3463xxxxxx'], // Comptes courants des associés débiteurs
                ['debut' => '4461', 'fin' => '4461xxxxxx'], // Associés - Capital à rembourser
                ['debut' => '4462', 'fin' => '4462xxxxxx'], // Associés - Versements reçus sur augm. capital
                ['debut' => '4463', 'fin' => '4463xxxxxx'], // Comptes courants des associés créditeurs
                ['debut' => '4465', 'fin' => '4465xxxxxx'], // Associés - Dividendes à payer
            ],

            // ─────────── ÉTAT & ORGANISMES ───────────
            'État' => [
                ['debut' => '3451', 'fin' => '3451xxxxxx'], // Subventions à recevoir
                ['debut' => '3453', 'fin' => '3453xxxxxx'], // Acomptes sur impôts sur résultats
                ['debut' => '3455', 'fin' => '3455xxxxxx'], // État - TVA récupérable
                ['debut' => '3456', 'fin' => '3456xxxxxx'], // État - Crédit de TVA
                ['debut' => '3458', 'fin' => '3458xxxxxx'], // État - Autres comptes débiteurs
                ['debut' => '4452', 'fin' => '4452xxxxxx'], // État - Impôts, taxes et assimilés
                ['debut' => '4453', 'fin' => '4453xxxxxx'], // État - Impôts sur les résultats
                ['debut' => '4455', 'fin' => '4455xxxxxx'], // État - TVA facturée (collectée)
                ['debut' => '4456', 'fin' => '4456xxxxxx'], // État - TVA due
                ['debut' => '4457', 'fin' => '4457xxxxxx'], // État - Impôts et taxes à payer
                ['debut' => '4458', 'fin' => '4458xxxxxx'], // État - Autres comptes créditeurs
            ],

            'Organismes Sociaux' => [
                ['debut' => '3441', 'fin' => '3441xxxxxx'], // Organismes sociaux débiteurs
                ['debut' => '4441', 'fin' => '4441xxxxxx'], // CNSS
                ['debut' => '4443', 'fin' => '4443xxxxxx'], // Caisses de retraite (CIMR...)
                ['debut' => '4445', 'fin' => '4445xxxxxx'], // Mutuelles
                ['debut' => '4447', 'fin' => '4447xxxxxx'], // Autres organismes sociaux
            ],

            // ─────────── TRÉSORERIE ───────────
            'Banque' => [
                ['debut' => '5141', 'fin' => '5141xxxxxx'], // Banques (solde débiteur)
                ['debut' => '5143', 'fin' => '5143xxxxxx'], // Trésorerie générale
                ['debut' => '5146', 'fin' => '5146xxxxxx'], // Chèques postaux
                ['debut' => '5147', 'fin' => '5147xxxxxx'], // Autres établissements financiers
                ['debut' => '5148', 'fin' => '5148xxxxxx'], // Intérêts courus à recevoir
                ['debut' => '5541', 'fin' => '5541xxxxxx'], // Banques (solde créditeur)
                ['debut' => '5548', 'fin' => '5548xxxxxx'], // Intérêts courus à payer
            ],

            'Caisse' => [
                ['debut' => '5161', 'fin' => '5161xxxxxx'], // Caisses (siège, succursales...)
                ['debut' => '5165', 'fin' => '5165xxxxxx'], // Régies d'avances et accréditifs
            ],

            'Chèques et Effets à Encaisser' => [
                ['debut' => '5111', 'fin' => '5111xxxxxx'], // Chèques à encaisser ou à l'encaissement
                ['debut' => '5113', 'fin' => '5113xxxxxx'], // Effets à encaisser ou à l'encaissement
            ],

            // ─────────── DÉBITEURS / CRÉDITEURS DIVERS ───────────
            'Débiteurs Divers' => [
                ['debut' => '3481', 'fin' => '3481xxxxxx'], // Créances rattachées comptes associés
                ['debut' => '3482', 'fin' => '3482xxxxxx'], // Créances sur cessions immobilisations
                ['debut' => '3483', 'fin' => '3483xxxxxx'], // Créances sur cessions VMP
                ['debut' => '3487', 'fin' => '3487xxxxxx'], // Créances rattachées débiteurs divers
                ['debut' => '3488', 'fin' => '3488xxxxxx'], // Divers débiteurs
            ],

            'Créditeurs Divers' => [
                ['debut' => '4481', 'fin' => '4481xxxxxx'], // Dettes sur acquisitions immobilisations
                ['debut' => '4483', 'fin' => '4483xxxxxx'], // Dettes sur acquisitions VMP
                ['debut' => '4484', 'fin' => '4484xxxxxx'], // Obligations échues à rembourser
                ['debut' => '4488', 'fin' => '4488xxxxxx'], // Divers créditeurs
            ],

            // ─────────── EMPRUNTS ───────────
            'Emprunt' => [
                ['debut' => '1481', 'fin' => '1481xxxxxx'], // Emprunts auprès des établissements de crédit
                ['debut' => '1483', 'fin' => '1483xxxxxx'], // Avances reçues et comptes courants bloqués
                ['debut' => '1484', 'fin' => '1484xxxxxx'], // Billets de fonds
                ['debut' => '1485', 'fin' => '1485xxxxxx'], // Avances de l'État
                ['debut' => '1486', 'fin' => '1486xxxxxx'], // Fournisseurs d'immobilisations
                ['debut' => '1487', 'fin' => '1487xxxxxx'], // Dépôts et cautionnements reçus
            ],

            // ─────────── AMORTISSEMENTS & PROVISIONS ───────────
            'Amortissement' => [
                ['debut' => '281', 'fin' => '281xxxxxx'], // Amort. des non-valeurs
                ['debut' => '282', 'fin' => '282xxxxxx'], // Amort. des immobilisations incorporelles
                ['debut' => '283', 'fin' => '283xxxxxx'], // Amort. des immobilisations corporelles
            ],

            'Provision' => [
                ['debut' => '151', 'fin' => '151xxxxxx'], // Provisions pour risques
                ['debut' => '155', 'fin' => '155xxxxxx'], // Provisions pour charges
                ['debut' => '291', 'fin' => '291xxxxxx'], // Provisions pour dépréciation des immo. incorp.
                ['debut' => '292', 'fin' => '292xxxxxx'], // Provisions pour dépréciation des immo. corp.
                ['debut' => '293', 'fin' => '293xxxxxx'], // Provisions pour dépréciation des immo. fin.
                ['debut' => '391', 'fin' => '391xxxxxx'], // Prov. dépréc. des stocks
                ['debut' => '394', 'fin' => '394xxxxxx'], // Prov. dépréc. créances actif circulant
                ['debut' => '395', 'fin' => '395xxxxxx'], // Prov. dépréc. titres et valeurs de placement
                ['debut' => '450', 'fin' => '450xxxxxx'], // Autres provisions pour risques et charges
                ['debut' => '590', 'fin' => '590xxxxxx'], // Prov. dépréc. comptes de trésorerie
            ],
        ];

        foreach ($natures as $label => $fourchettes) {
            $nature = NatureCompte::create(['label' => $label]);
            foreach ($fourchettes as $f) {
                $nature->fourchettes()->create($f);
            }
        }
    }
}
