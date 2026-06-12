<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected array $tables = [
        'devis',
        'commandes',
        'livraisons',
        'retours_vente',
        'factures_vente',
        'avoirs_vente',
        'contrats_vente',
    ];

    public function up(): void
    {
        foreach ($this->tables as $table) {
            Schema::table($table, function (Blueprint $tableGroup) use ($table) {
                if (!Schema::hasColumn($table, 'branche_id')) {
                    $tableGroup->foreignId('branche_id')
                        ->nullable()
                        ->constrained('branches')
                        ->nullOnDelete();
                }
            });
        }
    }

    public function down(): void
    {
        foreach ($this->tables as $table) {
            Schema::table($table, function (Blueprint $tableGroup) use ($table) {
                if (Schema::hasColumn($table, 'branche_id')) {
                    $tableGroup->dropForeign([$table . '_branche_id_foreign']);
                    $tableGroup->dropColumn('branche_id');
                }
            });
        }
    }
};
