<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $tables = [
            'devis_lines', 'commande_lines', 'facture_vente_lines', 'livraison_lines',
            'avoir_vente_lines', 'retour_vente_lines', 'contrat_vente_lines', 'contrat_achat_lines',
            'commande_achat_lines', 'reception_lines', 'facture_achat_lines', 'avoir_achat_lines',
            'demande_achat_lines', 'demande_prix_lines', 'retour_achat_lines'
        ];

        foreach ($tables as $table) {
            Schema::table($table, function (Blueprint $tableBlueprint) {
                $tableBlueprint->dropColumn('tva');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = [
            'devis_lines', 'commande_lines', 'facture_vente_lines', 'livraison_lines',
            'avoir_vente_lines', 'retour_vente_lines', 'contrat_vente_lines', 'contrat_achat_lines',
            'commande_achat_lines', 'reception_lines', 'facture_achat_lines', 'avoir_achat_lines',
            'demande_achat_lines', 'demande_prix_lines', 'retour_achat_lines'
        ];

        foreach ($tables as $table) {
            Schema::table($table, function (Blueprint $tableBlueprint) {
                $tableBlueprint->double('tva', 8, 2)->default(20.00);
            });
        }
    }
};
