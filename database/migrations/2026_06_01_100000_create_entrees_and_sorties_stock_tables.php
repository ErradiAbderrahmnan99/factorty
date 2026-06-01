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
        // 1. Create entrees_stock table
        Schema::create('entrees_stock', function (Blueprint $table) {
            $table->id();
            $table->string('ref', 100)->unique();
            $table->date('date_entree');
            $table->text('motif')->nullable();
            $table->foreignId('employee_id')->nullable()->constrained('employees')->nullOnDelete(); // Magasinier
            $table->string('status', 20)->default('brouillon'); // brouillon, valide, annule
            $table->timestamps();
        });

        // 2. Create entree_stock_lines table
        Schema::create('entree_stock_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entree_stock_id')->constrained('entrees_stock')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('entrepot_id')->constrained('entrepots')->cascadeOnDelete();
            $table->decimal('qty', 15, 4)->default(0.0000);
            $table->text('commentaire')->nullable();
            $table->string('lot_number')->nullable();
            $table->date('fabrication_date')->nullable();
            $table->date('expiration_date')->nullable();
            $table->timestamps();
        });

        // 3. Create sorties_stock table
        Schema::create('sorties_stock', function (Blueprint $table) {
            $table->id();
            $table->string('ref', 100)->unique();
            $table->date('date_sortie');
            $table->text('motif')->nullable();
            $table->foreignId('employee_id')->nullable()->constrained('employees')->nullOnDelete(); // Magasinier
            $table->string('status', 20)->default('brouillon'); // brouillon, valide, annule
            $table->timestamps();
        });

        // 4. Create sortie_stock_lines table
        Schema::create('sortie_stock_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sortie_stock_id')->constrained('sorties_stock')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('entrepot_id')->constrained('entrepots')->cascadeOnDelete();
            $table->decimal('qty', 15, 4)->default(0.0000);
            $table->text('commentaire')->nullable();
            $table->string('lot_number')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sortie_stock_lines');
        Schema::dropIfExists('sorties_stock');
        Schema::dropIfExists('entree_stock_lines');
        Schema::dropIfExists('entrees_stock');
    }
};
