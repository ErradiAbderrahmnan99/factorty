<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Demandes de Prix (RFQ)
        Schema::create('demandes_prix', function (Blueprint $table) {
            $table->id();
            $table->string('ref', 100)->unique();
            $table->date('date_demande');
            $table->date('date_validite')->nullable();
            $table->foreignId('employee_id')->nullable()->constrained('employees')->nullOnDelete();
            $table->foreignId('tier_id')->constrained('tiers')->cascadeOnDelete()->comment('Supplier to request price from');
            $table->foreignId('devise_id')->constrained('devises')->cascadeOnDelete();
            $table->text('note_public')->nullable();
            $table->text('note_private')->nullable();
            $table->string('status', 20)->default('brouillon'); // brouillon, envoyee, repondue, annulee
            $table->decimal('total_ht', 15, 4)->default(0.0000);
            $table->decimal('total_tva', 15, 4)->default(0.0000);
            $table->decimal('total_ttc', 15, 4)->default(0.0000);
            $table->timestamps();
        });

        // 2. Demande de Prix Lines
        Schema::create('demande_prix_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('demande_prix_id')->constrained('demandes_prix')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
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
    }

    public function down(): void
    {
        Schema::dropIfExists('demande_prix_lines');
        Schema::dropIfExists('demandes_prix');
    }
};
