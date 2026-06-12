<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Mode de règlement
        Schema::create('modes_reglement', function (Blueprint $table) {
            $table->id();
            $table->string('label', 100)->unique();
            $table->timestamps();
        });

        // 2. Conditions de règlement
        Schema::create('conditions_reglement', function (Blueprint $table) {
            $table->id();
            $table->string('label', 100)->unique();
            $table->string('code', 50)->unique();
            $table->text('label_long')->nullable();
            $table->timestamps();
        });

        // 3. Origines
        Schema::create('origines', function (Blueprint $table) {
            $table->id();
            $table->string('label', 100)->unique();
            $table->timestamps();
        });

        // 4. Comptes bancaires
        Schema::create('comptes_bancaires', function (Blueprint $table) {
            $table->id();
            $table->string('label', 150);
            $table->string('banque', 150)->nullable();
            $table->string('rib', 50)->nullable();
            $table->string('iban', 50)->nullable();
            $table->string('swift', 20)->nullable();
            $table->timestamps();
        });

        // 5. Types d'apporteur
        Schema::create('types_apporteur', function (Blueprint $table) {
            $table->id();
            $table->string('label', 100)->unique();
            $table->timestamps();
        });

        // 6. Apporteurs
        Schema::create('apporteurs', function (Blueprint $table) {
            $table->id();
            $table->string('label', 150);
            $table->foreignId('type_apporteur_id')->nullable()->constrained('types_apporteur')->nullOnDelete();
            $table->string('telephone', 30)->nullable();
            $table->string('email', 150)->nullable();
            $table->timestamps();
        });


        // 8. Add new columns to factures_vente
        Schema::table('factures_vente', function (Blueprint $table) {
            $table->foreignId('mode_reglement_id')->nullable()->after('devise_id')->constrained('modes_reglement')->nullOnDelete();
            $table->foreignId('condition_reglement_id')->nullable()->after('mode_reglement_id')->constrained('conditions_reglement')->nullOnDelete();
            $table->foreignId('origine_id')->nullable()->after('condition_reglement_id')->constrained('origines')->nullOnDelete();
            $table->foreignId('compte_bancaire_id')->nullable()->after('origine_id')->constrained('comptes_bancaires')->nullOnDelete();
            $table->foreignId('type_apporteur_id')->nullable()->after('compte_bancaire_id')->constrained('types_apporteur')->nullOnDelete();
            $table->foreignId('apporteur_id')->nullable()->after('type_apporteur_id')->constrained('apporteurs')->nullOnDelete();
            $table->integer('delai_livraison')->nullable()->after('apporteur_id')->comment('Délai en jours');
            $table->date('date_livraison')->nullable()->after('delai_livraison');
            $table->text('note_public')->nullable()->after('date_livraison');
            $table->text('note_private')->nullable()->after('note_public');
        });

        // 9. Add new columns to avoirs_vente
        Schema::table('avoirs_vente', function (Blueprint $table) {
            $table->foreignId('mode_reglement_id')->nullable()->after('devise_id')->constrained('modes_reglement')->nullOnDelete();
            $table->foreignId('condition_reglement_id')->nullable()->after('mode_reglement_id')->constrained('conditions_reglement')->nullOnDelete();
            $table->foreignId('origine_id')->nullable()->after('condition_reglement_id')->constrained('origines')->nullOnDelete();
            $table->foreignId('compte_bancaire_id')->nullable()->after('origine_id')->constrained('comptes_bancaires')->nullOnDelete();
            $table->foreignId('type_apporteur_id')->nullable()->after('compte_bancaire_id')->constrained('types_apporteur')->nullOnDelete();
            $table->foreignId('apporteur_id')->nullable()->after('type_apporteur_id')->constrained('apporteurs')->nullOnDelete();
            $table->text('note_public')->nullable()->after('apporteur_id');
            $table->text('note_private')->nullable()->after('note_public');
        });
    }

    public function down(): void
    {
        Schema::table('avoirs_vente', function (Blueprint $table) {
            $table->dropForeign(['mode_reglement_id']);
            $table->dropForeign(['condition_reglement_id']);
            $table->dropForeign(['origine_id']);
            $table->dropForeign(['compte_bancaire_id']);
            $table->dropForeign(['type_apporteur_id']);
            $table->dropForeign(['apporteur_id']);
            $table->dropColumn(['mode_reglement_id', 'condition_reglement_id', 'origine_id', 'compte_bancaire_id', 'type_apporteur_id', 'apporteur_id', 'note_public', 'note_private']);
        });

        Schema::table('factures_vente', function (Blueprint $table) {
            $table->dropForeign(['mode_reglement_id']);
            $table->dropForeign(['condition_reglement_id']);
            $table->dropForeign(['origine_id']);
            $table->dropForeign(['compte_bancaire_id']);
            $table->dropForeign(['type_apporteur_id']);
            $table->dropForeign(['apporteur_id']);
            $table->dropColumn(['mode_reglement_id', 'condition_reglement_id', 'origine_id', 'compte_bancaire_id', 'type_apporteur_id', 'apporteur_id', 'delai_livraison', 'date_livraison', 'note_public', 'note_private']);
        });


        Schema::dropIfExists('apporteurs');
        Schema::dropIfExists('types_apporteur');
        Schema::dropIfExists('comptes_bancaires');
        Schema::dropIfExists('origines');
        Schema::dropIfExists('conditions_reglement');
        Schema::dropIfExists('modes_reglement');
    }
};

