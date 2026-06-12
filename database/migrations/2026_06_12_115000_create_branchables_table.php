<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('branchables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branche_id')->constrained('branches')->onDelete('cascade');
            $table->morphs('branchable');
            $table->timestamps();

            // Unique index to prevent duplicate relations
            $table->unique(['branche_id', 'branchable_id', 'branchable_type'], 'branchables_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('branchables');
    }
};
