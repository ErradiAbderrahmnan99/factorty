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
        Schema::table('journal_comptables', function (Blueprint $table) {
            $table->dropColumn('nature');
            $table->foreignId('nature_compte_id')->nullable()->constrained('nature_comptes')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('journal_comptables', function (Blueprint $table) {
            $table->dropForeign(['nature_compte_id']);
            $table->dropColumn('nature_compte_id');
            $table->enum('nature', ['achat', 'vente', 'banque', 'caisse', 'od', 'an'])->default('od');
        });
    }
};
