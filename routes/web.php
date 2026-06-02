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
use App\Http\Controllers\FactureVenteController;
use App\Http\Controllers\AvoirVenteController;
use App\Http\Controllers\ContratVenteController;
use App\Http\Controllers\ContratAchatController;
use App\Http\Controllers\DemandeAchatController;
use App\Http\Controllers\DemandePrixController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\EntrepotController;
use App\Http\Controllers\CommandeController;
use App\Http\Controllers\ModeReglementController;
use App\Http\Controllers\ConditionReglementController;
use App\Http\Controllers\OrigineController;
use App\Http\Controllers\CompteBancaireController;
use App\Http\Controllers\TypeApprobateurController;
use App\Http\Controllers\RetourVenteController;
use App\Http\Controllers\EntreeStockController;
use App\Http\Controllers\SortieStockController;
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
    Route::delete('api/entrepot-lots/{id}', [CommandeController::class, 'deleteLot'])->name('api.entrepot-lots.destroy');
    Route::resource('commandes', CommandeController::class);

    // Bon de Livraison CRUD & Stock Management
    Route::post('livraisons/{livraison}/toggle-status', [LivraisonController::class, 'updateStatus'])->name('livraisons.toggle-status');
    Route::resource('livraisons', LivraisonController::class);

    // Facture Vente CRUD
    Route::get('api/factures-vente/{facture}', [FactureVenteController::class, 'getFactureWithLines'])->name('api.factures-vente.show');
    Route::post('factures-vente/{facturesVente}/toggle-status', [FactureVenteController::class, 'updateStatus'])->name('factures-vente.toggle-status');
    Route::resource('factures-vente', FactureVenteController::class);

    // Contrat Vente CRUD
    Route::get('api/contrats-vente/{contrat}', [ContratVenteController::class, 'getContratWithLines'])->name('api.contrats-vente.show');
    Route::post('contrats-vente/{contratsVente}/toggle-status', [ContratVenteController::class, 'updateStatus'])->name('contrats-vente.toggle-status');
    Route::resource('contrats-vente', ContratVenteController::class)->parameters([
        'contrats-vente' => 'contratsVente'
    ]);

    // Contrat Achat CRUD
    Route::post('contrats-achat/{contratsAchat}/toggle-status', [ContratAchatController::class, 'updateStatus'])->name('contrats-achat.toggle-status');
    Route::resource('contrats-achat', ContratAchatController::class)->parameters([
        'contrats-achat' => 'contratsAchat'
    ]);

    // Demande Achat CRUD
    Route::post('demandes-achat/{demandesAchat}/toggle-status', [DemandeAchatController::class, 'updateStatus'])->name('demandes-achat.toggle-status');
    Route::resource('demandes-achat', DemandeAchatController::class)->parameters([
        'demandes-achat' => 'demandesAchat'
    ]);

    // Demande Prix CRUD
    Route::post('demandes-prix/{demandesPrix}/toggle-status', [DemandePrixController::class, 'updateStatus'])->name('demandes-prix.toggle-status');
    Route::resource('demandes-prix', DemandePrixController::class)->parameters([
        'demandes-prix' => 'demandesPrix'
    ]);

    // Avoir Vente CRUD
    Route::post('avoirs-vente/{avoirsVente}/toggle-status', [AvoirVenteController::class, 'updateStatus'])->name('avoirs-vente.toggle-status');
    Route::resource('avoirs-vente', AvoirVenteController::class);

    // Retours Vente CRUD
    Route::post('retours-vente/{retourVente}/toggle-status', [RetourVenteController::class, 'updateStatus'])->name('retours-vente.toggle-status');
    Route::resource('retours-vente', RetourVenteController::class)->parameters([
        'retours-vente' => 'retourVente'
    ]);

    // Entrées de Stock
    Route::post('entrees-stock/{entreesStock}/toggle-status', [EntreeStockController::class, 'toggleStatus'])->name('entrees-stock.toggle-status');
    Route::resource('entrees-stock', EntreeStockController::class);

    // Sorties de Stock
    Route::post('sorties-stock/{sortiesStock}/toggle-status', [SortieStockController::class, 'toggleStatus'])->name('sorties-stock.toggle-status');
    Route::get('products/{product}/warehouses/{entrepot}/lots', [SortieStockController::class, 'getProductLots'])->name('products.lots');
    Route::resource('sorties-stock', SortieStockController::class);

    // New Facturation/Payment/Referential CRUDs
    Route::resource('modes-reglement', ModeReglementController::class)->except(['create', 'edit', 'show']);
    Route::resource('conditions-reglement', ConditionReglementController::class)->except(['create', 'edit', 'show']);
    Route::resource('origines', OrigineController::class)->except(['create', 'edit', 'show']);
    Route::resource('comptes-bancaires', CompteBancaireController::class)->except(['create', 'edit', 'show']);
    Route::resource('types-approbateur', TypeApprobateurController::class)->except(['create', 'edit', 'show']);
});

require __DIR__.'/auth.php';
