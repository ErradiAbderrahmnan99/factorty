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
        // 1. Create retours_achat table
        Schema::create('retours_achat', function (Blueprint $table) {
            $table->id();
            $table->string('ref', 100)->unique();
            $table->foreignId('tier_id')->constrained('tiers')->cascadeOnDelete();
            $table->date('date_retour');
            $table->foreignId('devise_id')->constrained('devises')->cascadeOnDelete();
            $table->foreignId('mode_reglement_id')->nullable()->constrained('modes_reglement')->nullOnDelete();
            $table->foreignId('condition_reglement_id')->nullable()->constrained('conditions_reglement')->nullOnDelete();
            $table->foreignId('compte_bancaire_id')->nullable()->constrained('comptes_bancaires')->nullOnDelete();
            $table->text('note_public')->nullable();
            $table->text('note_private')->nullable();
            $table->string('status', 20)->default('brouillon'); // brouillon, valide, annulee
            $table->decimal('total_ht', 15, 4)->default(0.0000);
            $table->decimal('total_tva', 15, 4)->default(0.0000);
            $table->decimal('total_ttc', 15, 4)->default(0.0000);
            $table->timestamps();
        });

        // 2. Create retour_achat_lines table
        Schema::create('retour_achat_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('retour_achat_id')->constrained('retours_achat')->cascadeOnDelete();
            $table->foreignId('reception_line_id')->nullable()->constrained('reception_lines')->nullOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('entrepot_id')->constrained('entrepots')->cascadeOnDelete();
            $table->foreignId('purchase_unit_id')->nullable()->constrained('units')->nullOnDelete();
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

        // 3. Create retour_achat_line_lots table
        Schema::create('retour_achat_line_lots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('retour_achat_line_id')->constrained('retour_achat_lines')->cascadeOnDelete();
            $table->string('lot_number');
            $table->decimal('quantity', 15, 4)->default(0.0000);
            $table->date('fabrication_date')->nullable();
            $table->date('expiration_date')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('retour_achat_line_lots');
        Schema::dropIfExists('retour_achat_lines');
        Schema::dropIfExists('retours_achat');
    }
};
