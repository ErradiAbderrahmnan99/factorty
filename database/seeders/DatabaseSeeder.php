<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Seed Admin User
        $user = User::where('email', 'admin@gmail.com')->first();
        if (!$user) {
            User::factory()->create([
                'name' => 'Admin Factoraty',
                'email' => 'admin@gmail.com',
                'password' => Hash::make('password'),
            ]);
        }

        // 2. Seed Product Categories
        $productCategories = [
            ['code' => 'CAT-ELEC', 'name' => 'Électronique', 'description' => 'Composants, microcontrôleurs, câbles et appareils électroniques.'],
            ['code' => 'CAT-MECA', 'name' => 'Mécanique', 'description' => 'Engrenages, vis, arbres, supports et pièces mécaniques.'],
            ['code' => 'CAT-CHIM', 'name' => 'Matières Premières / Chimie', 'description' => 'Résines, solvants, peintures et réactifs chimiques.'],
            ['code' => 'CAT-EMBA', 'name' => 'Emballages', 'description' => 'Cartons, palettes, films plastiques et étiquettes.'],
        ];

        foreach ($productCategories as $cat) {
            \App\Models\ProductCategory::updateOrCreate(['code' => $cat['code']], $cat);
        }

        // 3. Seed Unit Categories
        $weight = \App\Models\UnitCategory::updateOrCreate(
            ['code' => 'UNIT-MASS'],
            ['label' => 'Masse', 'description' => 'Unités de mesure de poids et masse.']
        );

        $length = \App\Models\UnitCategory::updateOrCreate(
            ['code' => 'UNIT-LEN'],
            ['label' => 'Longueur', 'description' => 'Unités de mesure de distance, longueur et dimensions.']
        );

        $volume = \App\Models\UnitCategory::updateOrCreate(
            ['code' => 'UNIT-VOL'],
            ['label' => 'Volume', 'description' => 'Unités de mesure de contenance liquide et volume gazeux.']
        );

        // 4. Seed Units
        $units = [
            // Masse (Base Unit = Kilogramme)
            [
                'unit_category_id' => $weight->id,
                'code' => 'KG',
                'label' => 'Kilogramme',
                'ratio' => 1.000000,
            ],
            [
                'unit_category_id' => $weight->id,
                'code' => 'G',
                'label' => 'Gramme',
                'ratio' => 0.001000,
            ],
            [
                'unit_category_id' => $weight->id,
                'code' => 'TON',
                'label' => 'Tonne',
                'ratio' => 1000.000000,
            ],
            // Longueur (Base Unit = Mètre)
            [
                'unit_category_id' => $length->id,
                'code' => 'M',
                'label' => 'Mètre',
                'ratio' => 1.000000,
            ],
            [
                'unit_category_id' => $length->id,
                'code' => 'MM',
                'label' => 'Millimètre',
                'ratio' => 0.001000,
            ],
            [
                'unit_category_id' => $length->id,
                'code' => 'CM',
                'label' => 'Centimètre',
                'ratio' => 0.010000,
            ],
            [
                'unit_category_id' => $length->id,
                'code' => 'KM',
                'label' => 'Kilomètre',
                'ratio' => 1000.000000,
            ],
            // Volume (Base Unit = Litre)
            [
                'unit_category_id' => $volume->id,
                'code' => 'L',
                'label' => 'Litre',
                'ratio' => 1.000000,
            ],
            [
                'unit_category_id' => $volume->id,
                'code' => 'ML',
                'label' => 'Millilitre',
                'ratio' => 0.001000,
            ],
        ];

        foreach ($units as $unit) {
            \App\Models\Unit::updateOrCreate(
                ['code' => $unit['code'], 'unit_category_id' => $unit['unit_category_id']],
                $unit
            );
        }

        // 5. Seed Products
        $catElec = \App\Models\ProductCategory::where('code', 'CAT-ELEC')->first();
        $catMeca = \App\Models\ProductCategory::where('code', 'CAT-MECA')->first();
        $catChim = \App\Models\ProductCategory::where('code', 'CAT-CHIM')->first();
        $catEmba = \App\Models\ProductCategory::where('code', 'CAT-EMBA')->first();

        $massCat = \App\Models\UnitCategory::where('code', 'UNIT-MASS')->first();
        $lenCat = \App\Models\UnitCategory::where('code', 'UNIT-LEN')->first();
        $volCat = \App\Models\UnitCategory::where('code', 'UNIT-VOL')->first();

        $uKg = \App\Models\Unit::where('code', 'KG')->first();
        $uG = \App\Models\Unit::where('code', 'G')->first();
        $uM = \App\Models\Unit::where('code', 'M')->first();
        $uCm = \App\Models\Unit::where('code', 'CM')->first();
        $uL = \App\Models\Unit::where('code', 'L')->first();
        $uMl = \App\Models\Unit::where('code', 'ML')->first();

        $products = [
            [
                'product_category_id' => $catElec->id,
                'ref' => 'PRD-ARD-UNO',
                'label' => 'Carte Arduino Uno Rev3',
                'unit_category_id' => $massCat->id,
                'stock_unit_id' => $uG->id,
                'purchase_unit_id' => $uG->id,
                'sale_unit_id' => $uG->id,
                'length' => 68.6,
                'width' => 53.4,
                'height' => 15.0,
                'stock_limit' => 10.0,
                'purchase_price' => 150.00,
                'sale_price' => 250.00,
                'status' => 'actif',
            ],
            [
                'product_category_id' => $catElec->id,
                'ref' => 'PRD-CAP-ULT',
                'label' => 'Capteur Ultrason HC-SR04',
                'unit_category_id' => $massCat->id,
                'stock_unit_id' => $uG->id,
                'purchase_unit_id' => $uG->id,
                'sale_unit_id' => $uG->id,
                'length' => 45.0,
                'width' => 20.0,
                'height' => 15.0,
                'stock_limit' => 25.0,
                'purchase_price' => 15.00,
                'sale_price' => 35.00,
                'status' => 'actif',
            ],
            [
                'product_category_id' => $catElec->id,
                'ref' => 'PRD-CAB-JMP',
                'label' => 'Câble Jumper 20cm (x40)',
                'unit_category_id' => $lenCat->id,
                'stock_unit_id' => $uCm->id,
                'purchase_unit_id' => $uCm->id,
                'sale_unit_id' => $uCm->id,
                'length' => 20.0,
                'width' => 1.0,
                'height' => 1.0,
                'stock_limit' => 50.0,
                'purchase_price' => 8.50,
                'sale_price' => 19.90,
                'status' => 'actif',
            ],
            [
                'product_category_id' => $catMeca->id,
                'ref' => 'PRD-ENG-40D',
                'label' => 'Engrenage Droit 40 Dents',
                'unit_category_id' => $massCat->id,
                'stock_unit_id' => $uG->id,
                'purchase_unit_id' => $uG->id,
                'sale_unit_id' => $uG->id,
                'length' => 42.0,
                'width' => 42.0,
                'height' => 8.0,
                'stock_limit' => 15.0,
                'purchase_price' => 45.00,
                'sale_price' => 89.00,
                'status' => 'actif',
            ],
            [
                'product_category_id' => $catMeca->id,
                'ref' => 'PRD-VIS-M4',
                'label' => 'Vis M4 x 16mm (x100)',
                'unit_category_id' => $massCat->id,
                'stock_unit_id' => $uG->id,
                'purchase_unit_id' => $uG->id,
                'sale_unit_id' => $uG->id,
                'length' => 16.0,
                'width' => 4.0,
                'height' => 4.0,
                'stock_limit' => 100.0,
                'purchase_price' => 12.00,
                'sale_price' => 25.00,
                'status' => 'actif',
            ],
            [
                'product_category_id' => $catMeca->id,
                'ref' => 'PRD-ARB-8MM',
                'label' => 'Arbre de Transmission 8mm',
                'unit_category_id' => $lenCat->id,
                'stock_unit_id' => $uM->id,
                'purchase_unit_id' => $uM->id,
                'sale_unit_id' => $uM->id,
                'length' => 1.0,
                'width' => 0.008,
                'height' => 0.008,
                'stock_limit' => 5.0,
                'purchase_price' => 75.00,
                'sale_price' => 150.00,
                'status' => 'actif',
            ],
            [
                'product_category_id' => $catChim->id,
                'ref' => 'PRD-RES-EPO',
                'label' => 'Résine Époxy Transparente 1L',
                'unit_category_id' => $volCat->id,
                'stock_unit_id' => $uL->id,
                'purchase_unit_id' => $uL->id,
                'sale_unit_id' => $uL->id,
                'stock_limit' => 10.0,
                'purchase_price' => 180.00,
                'sale_price' => 290.00,
                'status' => 'actif',
            ],
            [
                'product_category_id' => $catChim->id,
                'ref' => 'PRD-SOL-DEG',
                'label' => 'Solvant Dégraissant 500ml',
                'unit_category_id' => $volCat->id,
                'stock_unit_id' => $uMl->id,
                'purchase_unit_id' => $uMl->id,
                'sale_unit_id' => $uMl->id,
                'stock_limit' => 20.0,
                'purchase_price' => 35.00,
                'sale_price' => 65.00,
                'status' => 'actif',
            ],
            [
                'product_category_id' => $catEmba->id,
                'ref' => 'PRD-CRT-A4',
                'label' => 'Carton Emballage A4',
                'unit_category_id' => $massCat->id,
                'stock_unit_id' => $uG->id,
                'purchase_unit_id' => $uG->id,
                'sale_unit_id' => $uG->id,
                'length' => 310.0,
                'width' => 220.0,
                'height' => 150.0,
                'stock_limit' => 500.0,
                'purchase_price' => 1.80,
                'sale_price' => 4.50,
                'status' => 'actif',
            ],
            [
                'product_category_id' => $catEmba->id,
                'ref' => 'PRD-FLM-BUL',
                'label' => 'Film Bulle Rouleau 50m',
                'unit_category_id' => $lenCat->id,
                'stock_unit_id' => $uM->id,
                'purchase_unit_id' => $uM->id,
                'sale_unit_id' => $uM->id,
                'length' => 50.0,
                'stock_limit' => 5.0,
                'purchase_price' => 120.00,
                'sale_price' => 220.00,
                'status' => 'actif',
            ],
            [
                'product_category_id' => $catEmba->id,
                'ref' => 'PRD-PAL-STD',
                'label' => 'Palette Bois standard',
                'unit_category_id' => $massCat->id,
                'stock_unit_id' => $uKg->id,
                'purchase_unit_id' => $uKg->id,
                'sale_unit_id' => $uKg->id,
                'length' => 1200.0,
                'width' => 800.0,
                'height' => 144.0,
                'stock_limit' => 50.0,
                'purchase_price' => 60.00,
                'sale_price' => 120.00,
                'status' => 'inactif',
            ],
            [
                'product_category_id' => $catEmba->id,
                'ref' => 'PRD-RUB-ADH',
                'label' => 'Ruban Adhésif Polypropylène',
                'unit_category_id' => $lenCat->id,
                'stock_unit_id' => $uM->id,
                'purchase_unit_id' => $uM->id,
                'sale_unit_id' => $uM->id,
                'length' => 66.0,
                'stock_limit' => 100.0,
                'purchase_price' => 2.50,
                'sale_price' => 5.50,
                'status' => 'actif',
            ],
        ];

        foreach ($products as $p) {
            \App\Models\Product::updateOrCreate(['ref' => $p['ref']], $p);
        }

        // ─────────────────────────────────────────────────────────────────────
        // 8. Tiers Sub-CRUDs Seeds
        // ─────────────────────────────────────────────────────────────────────

        // Countries
        $countries = [
            ['code' => 'MA', 'label' => 'Maroc'],
            ['code' => 'FR', 'label' => 'France'],
            ['code' => 'ES', 'label' => 'Espagne'],
            ['code' => 'DE', 'label' => 'Allemagne'],
            ['code' => 'AE', 'label' => 'Émirats Arabes Unis'],
        ];
        foreach ($countries as $c) {
            \App\Models\Country::updateOrCreate(['code' => $c['code']], $c);
        }
        $ma = \App\Models\Country::where('code', 'MA')->first();
        $fr = \App\Models\Country::where('code', 'FR')->first();

        // Regions
        $regions = [
            ['country_id' => $ma->id, 'code' => 'CAS', 'label' => 'Casablanca-Settat'],
            ['country_id' => $ma->id, 'code' => 'RAB', 'label' => 'Rabat-Salé-Kénitra'],
            ['country_id' => $ma->id, 'code' => 'MAR', 'label' => 'Marrakech-Safi'],
            ['country_id' => $ma->id, 'code' => 'FES', 'label' => 'Fès-Meknès'],
            ['country_id' => $ma->id, 'code' => 'TAN', 'label' => 'Tanger-Tétouan-Al Hoceïma'],
            ['country_id' => $fr->id, 'code' => 'IDF', 'label' => 'Île-de-France'],
        ];
        foreach ($regions as $r) {
            \App\Models\Region::updateOrCreate(['code' => $r['code']], $r);
        }
        $regCas = \App\Models\Region::where('code', 'CAS')->first();
        $regRab = \App\Models\Region::where('code', 'RAB')->first();
        $regMar = \App\Models\Region::where('code', 'MAR')->first();

        // Cities
        $cities = [
            ['region_id' => $regCas->id, 'code' => 'CASA', 'label' => 'Casablanca'],
            ['region_id' => $regCas->id, 'code' => 'MHAM', 'label' => 'Mohammedia'],
            ['region_id' => $regCas->id, 'code' => 'BERR', 'label' => 'Berrechid'],
            ['region_id' => $regRab->id, 'code' => 'RABA', 'label' => 'Rabat'],
            ['region_id' => $regRab->id, 'code' => 'SALE', 'label' => 'Salé'],
            ['region_id' => $regRab->id, 'code' => 'KENI', 'label' => 'Kénitra'],
            ['region_id' => $regMar->id, 'code' => 'MARR', 'label' => 'Marrakech'],
        ];
        foreach ($cities as $c) {
            \App\Models\City::updateOrCreate(['code' => $c['code']], $c);
        }

        // Tier Categories
        $tierCats = [
            ['code' => 'DIST', 'label' => 'Distributeur', 'description' => 'Distributeurs et revendeurs agréés'],
            ['code' => 'GROS', 'label' => 'Grossiste', 'description' => 'Acheteurs en grande quantité'],
            ['code' => 'DET', 'label' => 'Détaillant', 'description' => 'Vendeurs au détail'],
            ['code' => 'IND', 'label' => 'Industriel', 'description' => 'Partenaires industriels'],
            ['code' => 'PART', 'label' => 'Particulier', 'description' => 'Clients individuels'],
        ];
        foreach ($tierCats as $tc) {
            \App\Models\TierCategory::updateOrCreate(['code' => $tc['code']], $tc);
        }

        // Seeding Type Approbateurs
        $typeApprobateurs = [
            'BUREAUX DE CONTROLE',
            'ARCHITECTES',
            "BUREAUX D'ETUDE",
            'ENTREPRISE',
            "MAITRES D'OUVRAGE",
            'AUTRE'
        ];
        foreach ($typeApprobateurs as $label) {
            \App\Models\TypeApprobateur::updateOrCreate(['label' => $label]);
        }

        // ─── Tiers (Prospects, Clients, Fournisseurs) ───────────────────────
        $distCat = \App\Models\TierCategory::where('code', 'DIST')->first();
        $indCat  = \App\Models\TierCategory::where('code', 'IND')->first();
        $casaCity = \App\Models\City::where('code', 'CASA')->first();
        $rabaCity = \App\Models\City::where('code', 'RABA')->first();

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
                'rc' => '123456 Casablanca', 'status' => 'actif', 'is_professionnel' => true,
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
            \App\Models\Tier::updateOrCreate(['ref' => $t['ref']], $t);
        }

        // 13. Seed Devises
        $devises = [
            ['code' => 'MAD', 'label' => 'Dirham Marocain', 'symbol' => 'DH'],
            ['code' => 'EUR', 'label' => 'Euro', 'symbol' => '€'],
            ['code' => 'USD', 'label' => 'Dollar Américain', 'symbol' => '$'],
        ];

        foreach ($devises as $devise) {
            \App\Models\Devise::updateOrCreate(['code' => $devise['code']], $devise);
        }
    }
}
