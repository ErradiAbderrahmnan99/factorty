<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\TierCategory;
use App\Models\City;
use App\Models\Country;
use App\Models\Tier;

class TierSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Tier Categories
        $tierCats = [
            ['code' => 'DIST', 'label' => 'Distributeur', 'description' => 'Distributeurs et revendeurs agréés'],
            ['code' => 'GROS', 'label' => 'Grossiste', 'description' => 'Acheteurs en grande quantité'],
            ['code' => 'DET', 'label' => 'Détaillant', 'description' => 'Vendeurs au détail'],
            ['code' => 'IND', 'label' => 'Industriel', 'description' => 'Partenaires industriels'],
            ['code' => 'PART', 'label' => 'Particulier', 'description' => 'Clients individuels'],
        ];
        foreach ($tierCats as $tc) {
            TierCategory::updateOrCreate(['code' => $tc['code']], $tc);
        }

        $distCat = TierCategory::where('code', 'DIST')->first();
        $indCat  = TierCategory::where('code', 'IND')->first();
        $casaCity = City::where('code', 'CASA')->first();
        $rabaCity = City::where('code', 'RABA')->first();
        $ma = Country::where('code', 'MA')->first();

        if (!$ma) {
            return;
        }

        $tiers = [
            // Prospects
            [
                'type' => 'prospect', 'ref' => 'PRO-2026-001', 'label' => 'TechMaroc Solutions',
                'is_professionnel' => true, 'tier_category_id' => $distCat?->id,
                'city_id' => $casaCity?->id, 'country_id' => $ma->id,
                'legal_form' => 'SARL', 'email' => 'contact@techmaroc.ma',
                'telephone' => '+212 522-456789', 'status' => 'actif', 'description' => 'Distributeur de matériel informatique à Casablanca.',
                'ice' => '002345678000001',
            ],
            [
                'type' => 'prospect', 'ref' => 'PRO-2026-002', 'label' => 'Groupe Atlas Industries',
                'is_professionnel' => true, 'tier_category_id' => $indCat?->id,
                'city_id' => $rabaCity?->id, 'country_id' => $ma->id,
                'legal_form' => 'SA', 'email' => 'atlas@groupeatlas.ma',
                'telephone' => '+212 537-112233', 'status' => 'actif',
            ],
            [
                'type' => 'prospect', 'ref' => 'PRO-2026-003', 'label' => 'Mohamed Alami',
                'is_professionnel' => false,
                'email' => 'm.alami@gmail.com', 'telephone' => '+212 661-112233',
                'status' => 'actif',
            ],
            // Clients
            [
                'type' => 'client', 'ref' => 'CLI-2026-001', 'label' => 'Sonatrac Maroc',
                'is_professionnel' => true, 'tier_category_id' => $distCat?->id,
                'city_id' => $casaCity?->id, 'country_id' => $ma->id,
                'legal_form' => 'SA', 'email' => 'commandes@sonatrac.ma',
                'telephone' => '+212 522-778899', 'website' => 'https://www.sonatrac.ma',
                'if_fiscal' => '12345678', 'ice' => '001122334455000',
                'rc' => '123456 Casablanca', 'status' => 'actif',
            ],
            [
                'type' => 'client', 'ref' => 'CLI-2026-002', 'label' => 'Label Vie Supermarché',
                'is_professionnel' => true, 'city_id' => $rabaCity?->id, 'country_id' => $ma->id,
                'email' => 'achats@labelvie.ma', 'telephone' => '+212 537-889900',
                'status' => 'actif',
            ],
            [
                'type' => 'client', 'ref' => 'CLI-2026-003', 'label' => 'Imane Benali',
                'is_professionnel' => false, 'email' => 'imane.benali@outlook.com',
                'telephone' => '+212 677-334455', 'status' => 'actif',
            ],
            // Fournisseurs
            [
                'type' => 'fournisseur', 'ref' => 'FOU-2026-001', 'label' => 'ElectroParts Maroc SARL',
                'is_professionnel' => true, 'tier_category_id' => $indCat?->id,
                'city_id' => $casaCity?->id, 'country_id' => $ma->id,
                'legal_form' => 'SARL', 'email' => 'fournisseur@electroparts.ma',
                'telephone' => '+212 522-001122', 'website' => 'https://www.electroparts.ma',
                'if_fiscal' => '87654321', 'rib' => 'MA64 011 5100 0100 0506 2001 5 003',
                'status' => 'actif',
            ],
            [
                'type' => 'fournisseur', 'ref' => 'FOU-2026-002', 'label' => 'PackagePro International',
                'is_professionnel' => true, 'country_id' => $ma->id,
                'email' => 'info@packagepro.ma', 'telephone' => '+212 537-556677',
                'status' => 'actif',
            ],
            [
                'type' => 'fournisseur', 'ref' => 'FOU-2026-003', 'label' => 'Acier & Métaux SA',
                'is_professionnel' => true, 'city_id' => $casaCity?->id, 'country_id' => $ma->id,
                'legal_form' => 'SA', 'email' => 'ventes@aciermetaux.ma',
                'telephone' => '+212 522-332211', 'status' => 'inactif',
            ],
        ];

        foreach ($tiers as $t) {
            Tier::updateOrCreate(['ref' => $t['ref']], $t);
        }
    }
}
