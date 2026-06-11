<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('receptions', function (Blueprint $table) {
            $table->foreignId('commande_achat_id')->nullable()->after('tier_id')->constrained('commandes_achat')->nullOnDelete();
        });

        Schema::table('commande_achat_lines', function (Blueprint $table) {
            $table->decimal('qty_receptionnee', 15, 4)->default(0.0000)->after('qty');
        });

        Schema::table('reception_lines', function (Blueprint $table) {
            $table->foreignId('commande_achat_line_id')
                ->nullable()
                ->after('reception_id')
                ->constrained('commande_achat_lines')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('reception_lines', function (Blueprint $table) {
            $table->dropForeign(['commande_achat_line_id']);
            $table->dropColumn('commande_achat_line_id');
        });

        Schema::table('commande_achat_lines', function (Blueprint $table) {
            $table->dropColumn('qty_receptionnee');
        });

        Schema::table('receptions', function (Blueprint $table) {
            $table->dropForeign(['commande_achat_id']);
            $table->dropColumn('commande_achat_id');
        });
    }
};
