<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('factures_achat', function (Blueprint $table) {
            $table->string('commercial')->nullable()->after('tier_id');
            $table->foreignId('mode_reglement_id')->nullable()->after('devise_id')->constrained('modes_reglement')->nullOnDelete();
            $table->foreignId('condition_reglement_id')->nullable()->after('mode_reglement_id')->constrained('conditions_reglement')->nullOnDelete();
            $table->foreignId('origine_id')->nullable()->after('condition_reglement_id')->constrained('origines')->nullOnDelete();
            $table->foreignId('compte_bancaire_id')->nullable()->after('origine_id')->constrained('comptes_bancaires')->nullOnDelete();
            $table->foreignId('approbateur_id')->nullable()->after('compte_bancaire_id')->constrained('tiers')->nullOnDelete();
            $table->integer('delai_livraison')->nullable()->after('approbateur_id')->comment('Délai en jours');
            $table->date('date_livraison')->nullable()->after('delai_livraison');
            $table->text('note_public')->nullable()->after('date_livraison');
            $table->text('note_private')->nullable()->after('note_public');
        });
    }

    public function down(): void
    {
        Schema::table('factures_achat', function (Blueprint $table) {
            $table->dropForeign(['mode_reglement_id']);
            $table->dropForeign(['condition_reglement_id']);
            $table->dropForeign(['origine_id']);
            $table->dropForeign(['compte_bancaire_id']);
            $table->dropForeign(['approbateur_id']);
            $table->dropColumn([
                'commercial',
                'mode_reglement_id',
                'condition_reglement_id',
                'origine_id',
                'compte_bancaire_id',
                'approbateur_id',
                'delai_livraison',
                'date_livraison',
                'note_public',
                'note_private',
            ]);
        });
    }
};
