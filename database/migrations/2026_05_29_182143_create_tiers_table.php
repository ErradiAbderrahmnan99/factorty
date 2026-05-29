<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tiers', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['prospect', 'client', 'fournisseur'])->index();
            $table->string('ref', 100)->nullable()->unique();
            $table->string('label');
            $table->boolean('is_professionnel')->default(false);
            $table->text('description')->nullable();
            $table->foreignId('parent_id')->nullable()->constrained('tiers')->nullOnDelete();
            $table->foreignId('tier_category_id')->nullable()->constrained('tier_categories')->nullOnDelete();

            // Localisation
            $table->string('address')->nullable();
            $table->foreignId('country_id')->nullable()->constrained('countries')->nullOnDelete();
            $table->foreignId('region_id')->nullable()->constrained('regions')->nullOnDelete();
            $table->foreignId('city_id')->nullable()->constrained('cities')->nullOnDelete();

            // Legal & Fiscal
            $table->foreignId('legal_form_id')->nullable()->constrained('legal_forms')->nullOnDelete();
            $table->string('if_fiscal', 50)->nullable();  // Identification Fiscale
            $table->string('ice', 50)->nullable();         // Identifiant Commun de l'Entreprise
            $table->string('rc', 50)->nullable();          // Registre de Commerce
            $table->string('cnss', 50)->nullable();        // Numéro de sécurité sociale
            $table->string('tp', 50)->nullable();          // Taxe Professionnelle
            $table->string('rib', 100)->nullable();        // RIB Bancaire
            $table->string('emploi', 100)->nullable();     // Emploi / Poste du contact

            // Contact
            $table->string('email')->nullable();
            $table->string('telephone', 30)->nullable();
            $table->string('website')->nullable();
            $table->string('fax', 30)->nullable();

            // Social Networks
            $table->string('linkedin')->nullable();
            $table->string('twitter')->nullable();
            $table->string('facebook')->nullable();
            $table->string('instagram')->nullable();

            $table->string('status', 20)->default('actif');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tiers');
    }
};
