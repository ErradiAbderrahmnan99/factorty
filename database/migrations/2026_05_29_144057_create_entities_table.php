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
        Schema::create('entities', function (Blueprint $table) {
            $table->id();
            $table->string('code')->nullable();
            $table->string('label');
            $table->text('adress')->nullable();
            $table->string('country')->nullable();
            $table->string('city')->nullable();
            $table->string('code_postal')->nullable();
            $table->string('tele')->nullable();
            $table->string('email')->nullable();
            $table->string('currency')->nullable();
            $table->string('tva')->nullable();
            $table->string('rc')->nullable();
            $table->string('patente')->nullable();
            $table->string('if')->nullable();
            $table->string('ice')->nullable();
            $table->string('cnss')->nullable();
            $table->string('forme_juridique')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('entities');
    }
};
