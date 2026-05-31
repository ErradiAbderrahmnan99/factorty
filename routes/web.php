<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProductCategoryController;
use App\Http\Controllers\UnitCategoryController;
use App\Http\Controllers\UnitController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\CountryController;
use App\Http\Controllers\RegionController;
use App\Http\Controllers\CityController;
use App\Http\Controllers\TierCategoryController;
use App\Http\Controllers\TierController;
use App\Http\Controllers\DeviseController;
use App\Http\Controllers\DevisController;
use App\Http\Controllers\LivraisonController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\EntrepotController;
use App\Http\Controllers\CommandeController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome');
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::patch('/profile/employee', [ProfileController::class, 'updateEmployee'])->name('profile.employee.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // DDB: Produits
    Route::resource('product-categories', ProductCategoryController::class);
    Route::resource('unit-categories', UnitCategoryController::class);
    Route::resource('units', UnitController::class);
    Route::resource('products', ProductController::class);
    Route::post('products/{product}/toggle-status', [ProductController::class, 'toggleStatus'])->name('products.toggle-status');

    // DDB: Tiers — Sub-CRUDs (lookup tables)
    Route::resource('countries', CountryController::class)->except(['create', 'edit', 'show']);
    Route::resource('regions', RegionController::class)->except(['create', 'edit', 'show']);
    Route::resource('cities', CityController::class)->except(['create', 'edit', 'show']);
    Route::resource('tier-categories', TierCategoryController::class)->except(['create', 'edit', 'show']);

    // DDB: Tiers — Main entity (Prospect / Client / Fournisseur) — type-scoped routes
    foreach (['prospects' => 'prospect', 'clients' => 'client', 'fournisseurs' => 'fournisseur'] as $plural => $type) {
        Route::get("/{$plural}", [TierController::class, 'index'])
            ->defaults('type', $type)->name("tiers.{$type}.index");
        Route::get("/{$plural}/create", [TierController::class, 'create'])
            ->defaults('type', $type)->name("tiers.{$type}.create");
        Route::post("/{$plural}", [TierController::class, 'store'])
            ->defaults('type', $type)->name("tiers.{$type}.store");
        Route::get("/{$plural}/{tier}/edit", [TierController::class, 'edit'])
            ->defaults('type', $type)->name("tiers.{$type}.edit");
        Route::patch("/{$plural}/{tier}", [TierController::class, 'update'])
            ->defaults('type', $type)->name("tiers.{$type}.update");
        Route::post("/{$plural}/{tier}/toggle-status", [TierController::class, 'toggleStatus'])
            ->defaults('type', $type)->name("tiers.{$type}.toggle-status");
        Route::delete("/{$plural}/{tier}", [TierController::class, 'destroy'])
            ->defaults('type', $type)->name("tiers.{$type}.destroy");
    }

    // DDB: Devises
    Route::resource('devises', DeviseController::class)->except(['create', 'edit', 'show']);

    // DDB: Employés
    Route::resource('employees', EmployeeController::class)->except(['create', 'edit', 'show']);

    // DDB: Entrepôts
    Route::resource('entrepots', EntrepotController::class)->except(['create', 'edit', 'show']);

    // Devis CRUD
    Route::get('devis/export-template', [DevisController::class, 'exportTemplate'])->name('devis.export-template');
    Route::post('devis/import', [DevisController::class, 'import'])->name('devis.import');
    Route::resource('devis', DevisController::class)->parameters([
        'devis' => 'devis'
    ]);
    Route::post('devis/{devis}/toggle-status', [DevisController::class, 'updateStatus'])->name('devis.toggle-status');

    // Commande Client CRUD & Stock / Lot Management
    Route::post('commandes/{commande}/valider', [CommandeController::class, 'valider'])->name('commandes.valider');
    Route::post('commandes/{commande}/toggle-status', [CommandeController::class, 'updateStatus'])->name('commandes.toggle-status');
    Route::get('api/entrepot-lots', [CommandeController::class, 'getLots'])->name('api.entrepot-lots');
    Route::resource('commandes', CommandeController::class);

    // Bon de Livraison CRUD & Stock Management
    Route::post('livraisons/{livraison}/toggle-status', [LivraisonController::class, 'updateStatus'])->name('livraisons.toggle-status');
    Route::resource('livraisons', LivraisonController::class);
});

require __DIR__.'/auth.php';
