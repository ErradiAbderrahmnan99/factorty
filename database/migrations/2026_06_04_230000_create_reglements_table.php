<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('statuts_reglement', function (Blueprint $table) {
            $table->id();
            $table->string('label', 100);
            $table->foreignId('mode_reglement_id')->constrained('modes_reglement')->onDelete('cascade');
            $table->boolean('is_banque')->default(false);
            $table->timestamps();

            $table->unique(['label', 'mode_reglement_id']);
        });

        Schema::create('reglements', function (Blueprint $table) {
            $table->id();
            $table->string('ref', 50)->unique();
            $table->string('type', 20); // 'vente' or 'achat'
            $table->foreignId('tier_id')->constrained('tiers')->onDelete('cascade');
            $table->date('date_saisie');
            $table->date('date_reglement');
            $table->decimal('montant_ttc', 15, 4);
            $table->foreignId('mode_reglement_id')->constrained('modes_reglement')->onDelete('restrict');
            $table->foreignId('statut_reglement_id')->constrained('statuts_reglement')->onDelete('restrict');
            $table->foreignId('compte_bancaire_id')->nullable()->constrained('comptes_bancaires')->onDelete('set null');
            $table->string('numero_transaction', 100)->nullable(); // Numéro chèque/virement
            $table->string('emetteur', 150)->nullable(); // Emetteur
            $table->string('banque_cheque', 150)->nullable(); // Banque du chèque
            $table->text('commentaire')->nullable();
            $table->char('sense', 1); // 'd' (débit) or 'c' (crédit)
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reglements');
        Schema::dropIfExists('statuts_reglement');
    }
};
