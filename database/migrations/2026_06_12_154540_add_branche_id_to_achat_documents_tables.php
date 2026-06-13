<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected array $tables = [
        'contrats_achat',
        'demandes_achat',
        'commandes_achat',
        'receptions',
        'retours_achat',
        'factures_achat',
        'avoirs_achat',
    ];

    /**
     * Run the migrations.
     */
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

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('achat_documents_tables', function (Blueprint $table) {
            //
        });
    }
};
