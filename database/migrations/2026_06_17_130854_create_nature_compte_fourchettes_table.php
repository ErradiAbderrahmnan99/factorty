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
        Schema::create('nature_compte_fourchettes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('nature_compte_id')->constrained()->cascadeOnDelete();
            $table->string('debut');
            $table->string('fin');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('nature_compte_fourchettes');
    }
};
