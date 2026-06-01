<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Factures Vente
        Schema::create('factures_vente', function (Blueprint $table) {
            $table->id();
            $table->string('ref', 100)->unique();
            $table->foreignId('tier_id')->constrained('tiers')->cascadeOnDelete();
            $table->string('commercial')->nullable();
            $table->date('date_facture');
            $table->date('date_echeance')->nullable();
            $table->foreignId('devise_id')->constrained('devises')->cascadeOnDelete();
            $table->string('status', 20)->default('brouillon'); // brouillon, envoyee, payee, annulee
            $table->decimal('total_ht', 15, 4)->default(0.0000);
            $table->decimal('total_tva', 15, 4)->default(0.0000);
            $table->decimal('total_ttc', 15, 4)->default(0.0000);
            $table->timestamps();
        });

        // 2. Facture Vente Lines
        Schema::create('facture_vente_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('facture_vente_id')->constrained('factures_vente')->cascadeOnDelete();
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

        // 3. Avoirs Vente
        Schema::create('avoirs_vente', function (Blueprint $table) {
            $table->id();
            $table->string('ref', 100)->unique();
            $table->foreignId('tier_id')->constrained('tiers')->cascadeOnDelete();
            $table->string('commercial')->nullable();
            $table->date('date_avoir');
            $table->foreignId('devise_id')->constrained('devises')->cascadeOnDelete();
            $table->string('status', 20)->default('brouillon'); // brouillon, valide, annule
            $table->decimal('total_ht', 15, 4)->default(0.0000);
            $table->decimal('total_tva', 15, 4)->default(0.0000);
            $table->decimal('total_ttc', 15, 4)->default(0.0000);
            $table->timestamps();
        });

        // 4. Avoir Vente Lines
        Schema::create('avoir_vente_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('avoir_vente_id')->constrained('avoirs_vente')->cascadeOnDelete();
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
        Schema::dropIfExists('avoir_vente_lines');
        Schema::dropIfExists('avoirs_vente');
        Schema::dropIfExists('facture_vente_lines');
        Schema::dropIfExists('factures_vente');
    }
};
