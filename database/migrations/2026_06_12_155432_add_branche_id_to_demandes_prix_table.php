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
        Schema::table('demandes_prix', function (Blueprint $table) {
            if (!Schema::hasColumn('demandes_prix', 'branche_id')) {
                $table->foreignId('branche_id')
                    ->nullable()
                    ->constrained('branches')
                    ->nullOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('demandes_prix', function (Blueprint $table) {
            if (Schema::hasColumn('demandes_prix', 'branche_id')) {
                $table->dropForeign(['demandes_prix_branche_id_foreign']);
                $table->dropColumn('branche_id');
            }
        });
    }
};
