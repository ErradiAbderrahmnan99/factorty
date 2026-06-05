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
        Schema::table('devis_lines', function (Blueprint $table) {
            $table->decimal('qty_commande', 15, 4)->default(0.0000)->after('qty');
        });

        Schema::table('commande_lines', function (Blueprint $table) {
            $table->foreignId('devis_line_id')
                ->nullable()
                ->after('commande_id')
                ->constrained('devis_lines')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('commande_lines', function (Blueprint $table) {
            $table->dropForeign(['devis_line_id']);
            $table->dropColumn('devis_line_id');
        });

        Schema::table('devis_lines', function (Blueprint $table) {
            $table->dropColumn('qty_commande');
        });
    }
};
