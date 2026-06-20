<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Add `taux_tva_id` (FK → taux_tvas) to every line table and to entities.
     * The existing `tva` double column is kept for backward-compat calculations;
     * it will be populated automatically from the chosen TauxTva record.
     * For entities, the old `default_tva` decimal is kept for the entity-settings
     * utility; we add `default_tva_id` as the canonical FK.
     */
    public function up(): void
    {
        $lineTables = [
            'devis_lines',
            'commande_lines',
            'livraison_lines',
            'facture_vente_lines',
            'avoir_vente_lines',
            'retour_vente_lines',
            'contrat_vente_lines',
            'contrat_achat_lines',
            'demande_achat_lines',
            'demande_prix_lines',
            'commande_achat_lines',
            'reception_lines',
            'retour_achat_lines',
            'facture_achat_lines',
            'avoir_achat_lines',
        ];

        foreach ($lineTables as $table) {
            if (Schema::hasTable($table) && !Schema::hasColumn($table, 'taux_tva_id')) {
                Schema::table($table, function (Blueprint $t) {
                    $t->foreignId('taux_tva_id')
                      ->nullable()
                      ->after('tva')
                      ->constrained('taux_tvas')
                      ->nullOnDelete();
                });
            }
        }

        // Also add on entities table
        if (Schema::hasTable('entities') && !Schema::hasColumn('entities', 'default_tva_id')) {
            Schema::table('entities', function (Blueprint $table) {
                $table->foreignId('default_tva_id')
                      ->nullable()
                      ->after('default_tva')
                      ->constrained('taux_tvas')
                      ->nullOnDelete();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $lineTables = [
            'devis_lines',
            'commande_lines',
            'livraison_lines',
            'facture_vente_lines',
            'avoir_vente_lines',
            'retour_vente_lines',
            'contrat_vente_lines',
            'contrat_achat_lines',
            'demande_achat_lines',
            'demande_prix_lines',
            'commande_achat_lines',
            'reception_lines',
            'retour_achat_lines',
            'facture_achat_lines',
            'avoir_achat_lines',
        ];

        foreach ($lineTables as $table) {
            if (Schema::hasTable($table) && Schema::hasColumn($table, 'taux_tva_id')) {
                Schema::table($table, function (Blueprint $t) {
                    $t->dropForeign(['taux_tva_id']);
                    $t->dropColumn('taux_tva_id');
                });
            }
        }

        if (Schema::hasTable('entities') && Schema::hasColumn('entities', 'default_tva_id')) {
            Schema::table('entities', function (Blueprint $table) {
                $table->dropForeign(['default_tva_id']);
                $table->dropColumn('default_tva_id');
            });
        }
    }
};
