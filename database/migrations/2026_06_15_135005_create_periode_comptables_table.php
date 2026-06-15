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
        Schema::create('periode_comptables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exercice_comptable_id')->constrained('exercice_comptables')->onDelete('cascade');
            $table->string('code');
            $table->string('libelle');
            $table->date('date_debut');
            $table->date('date_fin');
            $table->enum('statut', ['ouvert', 'cloture'])->default('ouvert');
            $table->timestamps();
            
            $table->unique(['exercice_comptable_id', 'code']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('periode_comptables');
    }
};
