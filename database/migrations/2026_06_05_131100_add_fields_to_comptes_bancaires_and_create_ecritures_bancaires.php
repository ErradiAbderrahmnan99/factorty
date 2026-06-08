<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('comptes_bancaires', function (Blueprint $table) {
            $table->foreignId('devise_id')->nullable()->constrained('devises')->onDelete('set null');
            $table->decimal('solde_min', 15, 4)->default(0);
            $table->decimal('solde', 15, 4)->default(0);
            $table->string('status', 10)->default('ouvert'); // 'ouvert' or 'ferme'
        });

        Schema::table('reglements', function (Blueprint $table) {
            $table->string('origin_type')->nullable();
            $table->unsignedBigInteger('origin_id')->nullable();
            $table->index(['origin_type', 'origin_id']);
        });

        Schema::create('ecritures_bancaires', function (Blueprint $table) {
            $table->id();
            $table->foreignId('compte_bancaire_id')->constrained('comptes_bancaires')->onDelete('cascade');
            $table->string('ref', 50);
            $table->date('date_operation');
            $table->date('date_valeur')->nullable();
            $table->text('description')->nullable();
            $table->foreignId('reglement_id')->nullable()->constrained('reglements')->onDelete('cascade');
            $table->string('type', 50);
            $table->string('origin_type')->nullable();
            $table->unsignedBigInteger('origin_id')->nullable();
            $table->string('numero_transaction', 100)->nullable();
            $table->decimal('amount', 15, 4);
            $table->char('sense', 1);
            $table->timestamps();

            $table->index(['origin_type', 'origin_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ecritures_bancaires');

        Schema::table('reglements', function (Blueprint $table) {
            $table->dropColumn(['origin_type', 'origin_id']);
        });

        Schema::table('comptes_bancaires', function (Blueprint $table) {
            $table->dropForeign(['devise_id']);
            $table->dropColumn(['devise_id', 'solde_min', 'solde', 'status']);
        });
    }
};
