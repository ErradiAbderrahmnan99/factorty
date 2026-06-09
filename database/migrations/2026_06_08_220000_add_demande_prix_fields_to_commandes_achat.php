<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('commandes_achat', function (Blueprint $table) {
            $table->foreignId('demande_prix_id')->nullable()->constrained('demandes_prix')->nullOnDelete();
        });

        Schema::table('demande_prix_lines', function (Blueprint $table) {
            $table->decimal('qty_commande', 15, 4)->default(0.0000)->after('qty');
        });

        Schema::table('commande_achat_lines', function (Blueprint $table) {
            $table->foreignId('demande_prix_line_id')
                ->nullable()
                ->after('commande_achat_id')
                ->constrained('demande_prix_lines')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('commande_achat_lines', function (Blueprint $table) {
            $table->dropForeign(['demande_prix_line_id']);
            $table->dropColumn('demande_prix_line_id');
        });

        Schema::table('demande_prix_lines', function (Blueprint $table) {
            $table->dropColumn('qty_commande');
        });

        Schema::table('commandes_achat', function (Blueprint $table) {
            $table->dropForeign(['demande_prix_id']);
            $table->dropColumn('demande_prix_id');
        });
    }
};
