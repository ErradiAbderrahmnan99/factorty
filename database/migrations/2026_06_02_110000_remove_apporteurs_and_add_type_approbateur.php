<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Drop foreign keys on child tables first
        Schema::table('factures_vente', function (Blueprint $table) {
            $table->dropForeign(['type_apporteur_id']);
            $table->dropForeign(['apporteur_id']);
            $table->dropColumn(['type_apporteur_id', 'apporteur_id']);
        });

        Schema::table('avoirs_vente', function (Blueprint $table) {
            $table->dropForeign(['type_apporteur_id']);
            $table->dropForeign(['apporteur_id']);
            $table->dropColumn(['type_apporteur_id', 'apporteur_id']);
        });

        Schema::table('contrats_vente', function (Blueprint $table) {
            $table->dropForeign(['type_apporteur_id']);
            $table->dropForeign(['apporteur_id']);
            $table->dropColumn(['type_apporteur_id', 'apporteur_id']);
        });

        // 2. Drop the original Apporteur tables
        Schema::dropIfExists('apporteurs');
        Schema::dropIfExists('types_apporteur');

        // 3. Create the new types_approbateur table
        Schema::create('types_approbateur', function (Blueprint $table) {
            $table->id();
            $table->string('label', 100)->unique();
            $table->timestamps();
        });

        // 4. Add type_approbateur_id to the tiers table
        Schema::table('tiers', function (Blueprint $table) {
            $table->foreignId('type_approbateur_id')->nullable()->constrained('types_approbateur')->nullOnDelete();
        });

        // 5. Add approbateur_id to factures_vente, avoirs_vente, contrats_vente (referencing tiers table)
        Schema::table('factures_vente', function (Blueprint $table) {
            $table->foreignId('approbateur_id')->nullable()->after('compte_bancaire_id')->constrained('tiers')->nullOnDelete();
        });

        Schema::table('avoirs_vente', function (Blueprint $table) {
            $table->foreignId('approbateur_id')->nullable()->after('compte_bancaire_id')->constrained('tiers')->nullOnDelete();
        });

        Schema::table('contrats_vente', function (Blueprint $table) {
            $table->foreignId('approbateur_id')->nullable()->after('compte_bancaire_id')->constrained('tiers')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('contrats_vente', function (Blueprint $table) {
            $table->dropForeign(['approbateur_id']);
            $table->dropColumn(['approbateur_id']);
        });

        Schema::table('avoirs_vente', function (Blueprint $table) {
            $table->dropForeign(['approbateur_id']);
            $table->dropColumn(['approbateur_id']);
        });

        Schema::table('factures_vente', function (Blueprint $table) {
            $table->dropForeign(['approbateur_id']);
            $table->dropColumn(['approbateur_id']);
        });

        Schema::table('tiers', function (Blueprint $table) {
            $table->dropForeign(['type_approbateur_id']);
            $table->dropColumn(['type_approbateur_id']);
        });

        Schema::dropIfExists('types_approbateur');
    }
};
