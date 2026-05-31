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
        // 1. Recreate entrepot_product with an auto-incrementing id, quantity column, and timestamps
        Schema::dropIfExists('entrepot_product');
        Schema::create('entrepot_product', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entrepot_id')->constrained('entrepots')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->decimal('quantity', 15, 4)->default(0.0000);
            $table->timestamps();
            
            $table->unique(['entrepot_id', 'product_id']);
        });

        // 2. Create entrepot_product_lots
        Schema::create('entrepot_product_lots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entrepot_product_id')->constrained('entrepot_product')->cascadeOnDelete();
            $table->string('lot_number');
            $table->decimal('quantity', 15, 4)->default(0.0000);
            $table->date('fabrication_date')->nullable();
            $table->date('expiration_date')->nullable();
            $table->timestamps();

            $table->unique(['entrepot_product_id', 'lot_number']);
        });

        // 3. Create commandes table
        Schema::create('commandes', function (Blueprint $table) {
            $table->id();
            $table->string('ref', 100)->unique();
            $table->foreignId('tier_id')->constrained('tiers')->cascadeOnDelete();
            $table->string('commercial')->nullable();
            $table->date('date_commande');
            $table->foreignId('devise_id')->constrained('devises')->cascadeOnDelete();
            $table->string('status', 20)->default('brouillon'); // brouillon, valide, annule
            $table->decimal('total_ht', 15, 4)->default(0.0000);
            $table->decimal('total_tva', 15, 4)->default(0.0000);
            $table->decimal('total_ttc', 15, 4)->default(0.0000);
            $table->timestamps();
        });

        // 4. Create commande_lines table
        Schema::create('commande_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('commande_id')->constrained('commandes')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('entrepot_id')->constrained('entrepots')->cascadeOnDelete();
            $table->foreignId('sale_unit_id')->nullable()->constrained('units')->nullOnDelete();
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

        // 5. Create commande_line_lots table
        Schema::create('commande_line_lots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('commande_line_id')->constrained('commande_lines')->cascadeOnDelete();
            $table->string('lot_number');
            $table->decimal('quantity', 15, 4)->default(0.0000);
            $table->date('fabrication_date')->nullable();
            $table->date('expiration_date')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('commande_line_lots');
        Schema::dropIfExists('commande_lines');
        Schema::dropIfExists('commandes');
        Schema::dropIfExists('entrepot_product_lots');
        
        // Recreate the simple entrepot_product table
        Schema::dropIfExists('entrepot_product');
        Schema::create('entrepot_product', function (Blueprint $table) {
            $table->foreignId('entrepot_id')->constrained('entrepots')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->primary(['entrepot_id', 'product_id']);
        });
    }
};
