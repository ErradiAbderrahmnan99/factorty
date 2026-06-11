<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('factures_achat', function (Blueprint $table) {
            $table->unsignedBigInteger('reception_id')->nullable()->after('note_private');
            $table->foreign('reception_id')->references('id')->on('receptions')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('factures_achat', function (Blueprint $table) {
            $table->dropForeign(['reception_id']);
            $table->dropColumn('reception_id');
        });
    }
};
