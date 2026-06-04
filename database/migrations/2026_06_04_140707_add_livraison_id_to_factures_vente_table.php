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
        Schema::table('factures_vente', function (Blueprint $table) {
            $table->foreignId('livraison_id')->nullable()->after('devise_id')->constrained('livraisons')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('factures_vente', function (Blueprint $table) {
            $table->dropForeign(['livraison_id']);
            $table->dropColumn('livraison_id');
        });
    }
};
