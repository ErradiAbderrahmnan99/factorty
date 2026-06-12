<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Update entities table to add default_tva and number_after_comma
        Schema::table('entities', function (Blueprint $table) {
            if (!Schema::hasColumn('entities', 'default_tva')) {
                $table->decimal('default_tva', 5, 2)->default(20.00)->after('forme_juridique');
            }
            if (!Schema::hasColumn('entities', 'number_after_comma')) {
                $table->integer('number_after_comma')->default(2)->after('default_tva');
            }
        });

        // Update branches table to add entity_id relation
        Schema::table('branches', function (Blueprint $table) {
            if (!Schema::hasColumn('branches', 'entity_id')) {
                $table->foreignId('entity_id')->nullable()->after('id')->constrained('entities')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            if (Schema::hasColumn('branches', 'entity_id')) {
                $table->dropForeign(['entity_id']);
                $table->dropColumn('entity_id');
            }
        });

        Schema::table('entities', function (Blueprint $table) {
            if (Schema::hasColumn('entities', 'default_tva')) {
                $table->dropColumn('default_tva');
            }
            if (Schema::hasColumn('entities', 'number_after_comma')) {
                $table->dropColumn('number_after_comma');
            }
        });
    }
};
