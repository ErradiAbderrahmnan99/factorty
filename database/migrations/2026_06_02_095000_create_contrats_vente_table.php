<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Contrats Vente
        Schema::create('contrats_vente', function (Blueprint $table) {
            $table->id();
            $table->string('ref', 100)->unique();
            $table->foreignId('tier_id')->constrained('tiers')->cascadeOnDelete();
            $table->string('commercial')->nullable();
            $table->date('date_contrat');
            $table->date('date_echeance')->nullable();
            $table->foreignId('devise_id')->constrained('devises')->cascadeOnDelete();
            $table->foreignId('mode_reglement_id')->nullable()->constrained('modes_reglement')->nullOnDelete();
            $table->foreignId('condition_reglement_id')->nullable()->constrained('conditions_reglement')->nullOnDelete();
            $table->foreignId('origine_id')->nullable()->constrained('origines')->nullOnDelete();
            $table->foreignId('compte_bancaire_id')->nullable()->constrained('comptes_bancaires')->nullOnDelete();
            $table->foreignId('type_apporteur_id')->nullable()->constrained('types_apporteur')->nullOnDelete();
            $table->foreignId('apporteur_id')->nullable()->constrained('apporteurs')->nullOnDelete();
            $table->integer('delai_livraison')->nullable()->comment('Délai en jours');
            $table->date('date_livraison')->nullable();
            $table->text('note_public')->nullable();
            $table->text('note_private')->nullable();
            $table->string('status', 20)->default('brouillon'); // brouillon, actif, suspendu, expire, annule
            $table->decimal('total_ht', 15, 4)->default(0.0000);
            $table->decimal('total_tva', 15, 4)->default(0.0000);
            $table->decimal('total_ttc', 15, 4)->default(0.0000);
            $table->timestamps();
        });

        // 2. Contrat Vente Lines
        Schema::create('contrat_vente_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contrat_vente_id')->constrained('contrats_vente')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('sale_unit_id')->nullable()->constrained('units')->nullOnDelete();
            $table->decimal('tva', 8, 2)->default(20.00);
            $table->decimal('qty', 15, 4)->default(1.0000);
            $table->decimal('pu_ht', 15, 4)->default(0.0000);
            $table->decimal('pu_ttc', 15, 4)->default(0.0000);
            $table->decimal('remise', 8, 2)->default(0.00);
            $table->decimal('rm', 15, 4)->default(0.0000);
            $table->decimal('total_ht', 15, 4)->default(0.0000);
            $table->decimal('total_ttc', 15, 4)->default(0.0000);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contrat_vente_lines');
        Schema::dropIfExists('contrats_vente');
    }
};
