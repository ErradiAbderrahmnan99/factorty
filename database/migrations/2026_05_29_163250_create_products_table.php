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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_category_id')->nullable()->constrained('product_categories')->nullOnDelete();
            $table->string('ref')->nullable()->unique();
            $table->string('label');
            $table->foreignId('unit_category_id')->nullable()->constrained('unit_categories')->nullOnDelete();
            $table->foreignId('stock_unit_id')->nullable()->constrained('units')->nullOnDelete();
            $table->foreignId('purchase_unit_id')->nullable()->constrained('units')->nullOnDelete();
            $table->foreignId('sale_unit_id')->nullable()->constrained('units')->nullOnDelete();
            $table->decimal('length', 15, 4)->nullable();
            $table->decimal('height', 15, 4)->nullable();
            $table->decimal('width', 15, 4)->nullable();
            $table->decimal('stock_limit', 15, 4)->default(0.0000);
            $table->decimal('sale_price', 15, 4)->default(0.0000);
            $table->decimal('purchase_price', 15, 4)->default(0.0000);
            $table->string('image_path')->nullable();
            $table->string('status')->default('actif'); // actif / inactif
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
