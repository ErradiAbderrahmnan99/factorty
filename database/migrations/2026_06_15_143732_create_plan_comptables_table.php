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
        Schema::create('plan_comptables', function (Blueprint $table) {
            $table->id();
            $table->string('numero')->unique();
            $table->string('libelle');
            $table->foreignId('classe_id')->constrained('classe_comptables')->cascadeOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('plan_comptables')->nullOnDelete();
            $table->enum('sens', ['debit', 'credit', 'mixte'])->default('mixte');
            $table->boolean('collectif')->default(false);
            $table->foreignId('tier_id')->nullable()->constrained('tiers')->nullOnDelete();
            $table->boolean('lettrable')->default(false);
            $table->boolean('actif')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plan_comptables');
    }
};
