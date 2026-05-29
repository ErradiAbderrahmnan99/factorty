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
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->string('first_name');
            $table->string('last_name');
            $table->foreignId('department_id')->nullable()->index();
            $table->string('tele')->nullable();
            $table->string('email')->nullable();
            $table->text('adress')->nullable();
            $table->string('cin')->nullable();
            $table->date('birth_date')->nullable();
            $table->string('gender')->nullable();
            $table->foreignId('country_id')->nullable()->index();
            $table->foreignId('region_id')->nullable()->index();
            $table->foreignId('city_id')->nullable()->index();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
