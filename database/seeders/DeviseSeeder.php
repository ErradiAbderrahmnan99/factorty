<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Devise;

class DeviseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $devises = [
            ['code' => 'MAD', 'label' => 'Dirham Marocain', 'symbol' => 'DH'],
            ['code' => 'EUR', 'label' => 'Euro', 'symbol' => '€'],
            ['code' => 'USD', 'label' => 'Dollar Américain', 'symbol' => '$'],
        ];

        foreach ($devises as $devise) {
            Devise::updateOrCreate(['code' => $devise['code']], $devise);
        }
    }
}
