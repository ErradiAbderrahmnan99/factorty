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
        // 1. Create entree_stock_line_lots table
        Schema::create('entree_stock_line_lots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entree_stock_line_id')->constrained('entree_stock_lines')->cascadeOnDelete();
            $table->string('lot_number');
            $table->decimal('quantity', 15, 4)->default(0.0000);
            $table->date('fabrication_date')->nullable();
            $table->date('expiration_date')->nullable();
            $table->timestamps();
        });

        // 2. Create sortie_stock_line_lots table
        Schema::create('sortie_stock_line_lots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sortie_stock_line_id')->constrained('sortie_stock_lines')->cascadeOnDelete();
            $table->string('lot_number');
            $table->decimal('quantity', 15, 4)->default(0.0000);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sortie_stock_line_lots');
        Schema::dropIfExists('entree_stock_line_lots');
    }
};
