<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\TypeApprobateur;

class TypeApprobateurSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $typeApprobateurs = [
            'BUREAUX DE CONTROLE',
            'ARCHITECTES',
            "BUREAUX D'ETUDE",
            'ENTREPRISE',
            "MAITRES D'OUVRAGE",
            'AUTRE'
        ];
        foreach ($typeApprobateurs as $label) {
            TypeApprobateur::updateOrCreate(['label' => $label]);
        }
    }
}
