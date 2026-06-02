<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Demandes Achat
        Schema::create('demandes_achat', function (Blueprint $table) {
            $table->id();
            $table->string('ref', 100)->unique();
            $table->date('date_demande');
            $table->string('urgence', 20)->default('normal'); // normal, important, urgent
            $table->foreignId('employee_id')->nullable()->constrained('employees')->nullOnDelete();
            $table->foreignId('tier_id')->nullable()->constrained('tiers')->nullOnDelete()->comment('Suggested supplier');
            $table->foreignId('devise_id')->constrained('devises')->cascadeOnDelete();
            $table->text('note_public')->nullable();
            $table->text('note_private')->nullable();
            $table->string('status', 20)->default('brouillon'); // brouillon, validee, rejetee, commandee
            $table->decimal('total_ht', 15, 4)->default(0.0000);
            $table->decimal('total_tva', 15, 4)->default(0.0000);
            $table->decimal('total_ttc', 15, 4)->default(0.0000);
            $table->timestamps();
        });

        // 2. Demande Achat Lines
        Schema::create('demande_achat_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('demande_achat_id')->constrained('demandes_achat')->cascadeOnDelete();
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
        Schema::dropIfExists('demande_achat_lines');
        Schema::dropIfExists('demandes_achat');
    }
};
