<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('demandes_achat', function (Blueprint $table) {
            $table->foreignId('mode_reglement_id')->nullable()->after('devise_id')->constrained('modes_reglement')->nullOnDelete();
            $table->foreignId('condition_reglement_id')->nullable()->after('mode_reglement_id')->constrained('conditions_reglement')->nullOnDelete();
            $table->foreignId('compte_bancaire_id')->nullable()->after('condition_reglement_id')->constrained('comptes_bancaires')->nullOnDelete();
        });

        Schema::table('demandes_prix', function (Blueprint $table) {
            $table->foreignId('mode_reglement_id')->nullable()->after('devise_id')->constrained('modes_reglement')->nullOnDelete();
            $table->foreignId('condition_reglement_id')->nullable()->after('mode_reglement_id')->constrained('conditions_reglement')->nullOnDelete();
            $table->foreignId('compte_bancaire_id')->nullable()->after('condition_reglement_id')->constrained('comptes_bancaires')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('demandes_achat', function (Blueprint $table) {
            $table->dropForeign(['mode_reglement_id']);
            $table->dropForeign(['condition_reglement_id']);
            $table->dropForeign(['compte_bancaire_id']);
            $table->dropColumn(['mode_reglement_id', 'condition_reglement_id', 'compte_bancaire_id']);
        });

        Schema::table('demandes_prix', function (Blueprint $table) {
            $table->dropForeign(['mode_reglement_id']);
            $table->dropForeign(['condition_reglement_id']);
            $table->dropForeign(['compte_bancaire_id']);
            $table->dropColumn(['mode_reglement_id', 'condition_reglement_id', 'compte_bancaire_id']);
        });
    }
};
