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
        Schema::table('commande_lines', function (Blueprint $table) {
            $table->decimal('qty_livre', 15, 4)->default(0.0000)->after('qty');
        });

        Schema::table('livraison_lines', function (Blueprint $table) {
            $table->foreignId('commande_line_id')
                ->nullable()
                ->after('livraison_id')
                ->constrained('commande_lines')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('livraison_lines', function (Blueprint $table) {
            $table->dropForeign(['commande_line_id']);
            $table->dropColumn('commande_line_id');
        });

        Schema::table('commande_lines', function (Blueprint $table) {
            $table->dropColumn('qty_livre');
        });
    }
};
