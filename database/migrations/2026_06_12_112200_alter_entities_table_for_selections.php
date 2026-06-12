<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('entities', function (Blueprint $table) {
            // Drop old string columns & legacy tva
            if (Schema::hasColumn('entities', 'tva')) {
                $table->dropColumn('tva');
            }
            if (Schema::hasColumn('entities', 'country')) {
                $table->dropColumn('country');
            }
            if (Schema::hasColumn('entities', 'city')) {
                $table->dropColumn('city');
            }
            if (Schema::hasColumn('entities', 'currency')) {
                $table->dropColumn('currency');
            }

            // Add new foreign keys
            if (!Schema::hasColumn('entities', 'country_id')) {
                $table->foreignId('country_id')->nullable()->after('adress')->constrained('countries')->nullOnDelete();
            }
            if (!Schema::hasColumn('entities', 'region_id')) {
                $table->foreignId('region_id')->nullable()->after('country_id')->constrained('regions')->nullOnDelete();
            }
            if (!Schema::hasColumn('entities', 'city_id')) {
                $table->foreignId('city_id')->nullable()->after('region_id')->constrained('cities')->nullOnDelete();
            }
            if (!Schema::hasColumn('entities', 'devise_id')) {
                $table->foreignId('devise_id')->nullable()->after('city_id')->constrained('devises')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('entities', function (Blueprint $table) {
            if (Schema::hasColumn('entities', 'country_id')) {
                $table->dropForeign(['country_id']);
                $table->dropColumn('country_id');
            }
            if (Schema::hasColumn('entities', 'region_id')) {
                $table->dropForeign(['region_id']);
                $table->dropColumn('region_id');
            }
            if (Schema::hasColumn('entities', 'city_id')) {
                $table->dropForeign(['city_id']);
                $table->dropColumn('city_id');
            }
            if (Schema::hasColumn('entities', 'devise_id')) {
                $table->dropForeign(['devise_id']);
                $table->dropColumn('devise_id');
            }

            // Restore string columns
            $table->string('tva')->nullable();
            $table->string('country')->nullable();
            $table->string('city')->nullable();
            $table->string('currency')->nullable();
        });
    }
};
