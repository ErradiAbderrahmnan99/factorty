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
        Schema::create('taux_tvas', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('libelle');
            $table->decimal('taux', 5, 2);
            $table->foreignId('compte_tva_collectee_id')->nullable()->constrained('plan_comptables')->nullOnDelete();
            $table->foreignId('compte_tva_deductible_bs_id')->nullable()->constrained('plan_comptables')->nullOnDelete();
            $table->foreignId('compte_tva_deductible_immo_id')->nullable()->constrained('plan_comptables')->nullOnDelete();
            $table->boolean('actif')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('taux_tvas');
    }
};
