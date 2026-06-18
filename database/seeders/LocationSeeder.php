<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Country;
use App\Models\Region;
use App\Models\City;

class LocationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Countries
        $countries = [
            ['code' => 'MA', 'label' => 'Maroc'],
            ['code' => 'FR', 'label' => 'France'],
            ['code' => 'ES', 'label' => 'Espagne'],
            ['code' => 'DE', 'label' => 'Allemagne'],
            ['code' => 'AE', 'label' => 'Émirats Arabes Unis'],
        ];
        foreach ($countries as $c) {
            Country::updateOrCreate(['code' => $c['code']], $c);
        }
        $ma = Country::where('code', 'MA')->first();
        $fr = Country::where('code', 'FR')->first();

        if (!$ma || !$fr) {
            return;
        }

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
            Region::updateOrCreate(['code' => $r['code']], $r);
        }
        $regCas = Region::where('code', 'CAS')->first();
        $regRab = Region::where('code', 'RAB')->first();
        $regMar = Region::where('code', 'MAR')->first();

        if (!$regCas || !$regRab || !$regMar) {
            return;
        }

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
            City::updateOrCreate(['code' => $c['code']], $c);
        }
    }
}
