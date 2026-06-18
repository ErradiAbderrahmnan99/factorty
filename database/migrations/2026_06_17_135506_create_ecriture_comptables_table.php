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
        Schema::create('pieces_comptables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('journal_comptable_id')->constrained('journal_comptables')->cascadeOnDelete();
            $table->foreignId('exercice_comptable_id')->constrained('exercice_comptables')->cascadeOnDelete();
            $table->foreignId('periode_comptable_id')->constrained('periode_comptables')->cascadeOnDelete();
            $table->integer('jour');
            $table->string('numero_piece')->unique();
            $table->string('numero_facture')->nullable()->unique();
            $table->timestamps();
        });

        Schema::create('ecriture_comptables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('piece_comptable_id')->constrained('pieces_comptables')->cascadeOnDelete();
            $table->foreignId('plan_comptable_id')->constrained('plan_comptables')->cascadeOnDelete();
            $table->foreignId('compte_tier_id')->nullable()->constrained('plan_comptables')->nullOnDelete();
            $table->string('libelle');
            $table->date('date_echeance')->nullable();
            $table->decimal('debit', 15, 2)->default(0);
            $table->decimal('credit', 15, 2)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ecriture_comptables');
        Schema::dropIfExists('pieces_comptables');
    }
};
