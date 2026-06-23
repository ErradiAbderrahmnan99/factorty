<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Tier;
use App\Models\Product;
use App\Models\Devise;
use App\Models\Unit;
use App\Models\UnitCategory;
use App\Models\Entrepot;
use App\Models\Reception;
use App\Models\ReceptionLine;
use App\Models\RetourAchat;
use App\Models\RetourAchatLine;
use App\Models\ProductEntrepot;
use App\Models\ProductLot;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RetourAchatTest extends TestCase
{
    use RefreshDatabase;

    private $user;
    private $fournisseur;
    private $devise;
    private $unitCategory;
    private $unit;
    private $entrepot;
    private $productWithLot;
    private $productWithoutLot;
    private $reception;
    private $tauxTva;
    private $branche;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();

        $this->tauxTva = \App\Models\TauxTva::create([
            'code' => 'TVA20',
            'libelle' => 'TVA 20%',
            'taux' => 20.00,
            'actif' => true,
        ]);

        $this->branche = \App\Models\Branche::create([
            'name' => 'Branche Test',
        ]);

        $this->fournisseur = Tier::create([
            'type' => 'fournisseur',
            'ref' => 'FOU-TEST',
            'label' => 'Test Supplier',
            'status' => 'actif',
        ]);

        $this->devise = Devise::create([
            'code' => 'MAD',
            'label' => 'Dirham Marocain',
            'symbol' => 'DH',
        ]);

        $this->unitCategory = UnitCategory::create([
            'code' => 'UNIT-MAS',
            'label' => 'Masse',
        ]);

        $this->unit = Unit::create([
            'unit_category_id' => $this->unitCategory->id,
            'code' => 'U',
            'label' => 'Unité',
            'ratio' => 1.0,
        ]);

        $this->entrepot = Entrepot::create([
            'code' => 'WH-MAIN',
            'label' => 'Main Warehouse',
            'status' => 'actif',
        ]);

        $this->productWithLot = Product::create([
            'ref' => 'PROD-LOT',
            'label' => 'Product with Lot',
            'purchase_unit_id' => $this->unit->id,
            'stock_unit_id' => $this->unit->id,
            'manage_by_lot' => true,
            'stock_negative' => false,
            'status' => 'actif',
        ]);

        $this->productWithoutLot = Product::create([
            'ref' => 'PROD-NOLOT',
            'label' => 'Product without Lot',
            'purchase_unit_id' => $this->unit->id,
            'stock_unit_id' => $this->unit->id,
            'manage_by_lot' => false,
            'stock_negative' => false,
            'status' => 'actif',
        ]);

        // Create a Reception
        $this->reception = Reception::create([
            'ref' => 'REC-202606-0001',
            'tier_id' => $this->fournisseur->id,
            'date_reception' => '2026-06-01',
            'devise_id' => $this->devise->id,
            'status' => 'valide',
            'total_ht' => 1500,
            'total_tva' => 300,
            'total_ttc' => 1800,
        ]);

        // Reception lines
        $lineLot = ReceptionLine::create([
            'reception_id' => $this->reception->id,
            'product_id' => $this->productWithLot->id,
            'entrepot_id' => $this->entrepot->id,
            'purchase_unit_id' => $this->unit->id,
            'qty' => 10,
            'pu_ht' => 100,
            'pu_ttc' => 120,
            'taux_tva_id' => $this->tauxTva->id,
            'remise' => 0,
            'rm' => 0,
            'total_ht' => 1000,
            'total_ttc' => 1200,
        ]);

        $lineLot->lots()->create([
            'lot_number' => 'LOT-001',
            'quantity' => 10,
        ]);

        $lineNoLot = ReceptionLine::create([
            'reception_id' => $this->reception->id,
            'product_id' => $this->productWithoutLot->id,
            'entrepot_id' => $this->entrepot->id,
            'purchase_unit_id' => $this->unit->id,
            'qty' => 5,
            'pu_ht' => 100,
            'pu_ttc' => 120,
            'taux_tva_id' => $this->tauxTva->id,
            'remise' => 0,
            'rm' => 0,
            'total_ht' => 500,
            'total_ttc' => 600,
        ]);

        // Populate database stock to allow deductions
        $pe1 = ProductEntrepot::create([
            'product_id' => $this->productWithLot->id,
            'entrepot_id' => $this->entrepot->id,
            'quantity' => 10.0,
        ]);
        ProductLot::create([
            'entrepot_product_id' => $pe1->id,
            'lot_number' => 'LOT-001',
            'quantity' => 10.0,
        ]);

        ProductEntrepot::create([
            'product_id' => $this->productWithoutLot->id,
            'entrepot_id' => $this->entrepot->id,
            'quantity' => 5.0,
        ]);
    }

    public function test_can_view_retours_achat_index()
    {
        $response = $this->actingAs($this->user)
            ->get(route('retours-achat.index'));

        $response->assertStatus(200);
    }

    public function test_can_view_retours_achat_create()
    {
        $response = $this->actingAs($this->user)
            ->get(route('retours-achat.create'));

        $response->assertStatus(200);
    }

    public function test_can_store_retour_achat()
    {
        $receptionLine1 = $this->reception->lines->first();

        $response = $this->actingAs($this->user)
            ->post(route('retours-achat.store'), [
                'tier_id' => $this->fournisseur->id,
                'date_retour' => '2026-06-03',
                'devise_id' => $this->devise->id,
                'branche_id' => $this->branche->id,
                'lines' => [
                    [
                        'reception_line_id' => $receptionLine1->id,
                        'product_id' => $this->productWithLot->id,
                        'entrepot_id' => $this->entrepot->id,
                        'purchase_unit_id' => $this->unit->id,
                        'qty' => 5.0,
                        'pu_ht' => 100.0,
                        'pu_ttc' => 120.0,
                        'taux_tva_id' => $this->tauxTva->id,
                        'remise' => 0,
                        'rm' => 0,
                        'lots' => [
                            [
                                'lot_number' => 'LOT-001',
                                'quantity' => 5.0,
                            ]
                        ]
                    ]
                ]
            ]);

        $response->assertRedirect(route('retours-achat.index'));
        $this->assertDatabaseHas('retours_achat', [
            'tier_id' => $this->fournisseur->id,
            'status' => 'brouillon',
        ]);
        $this->assertDatabaseHas('retour_achat_lines', [
            'product_id' => $this->productWithLot->id,
            'qty' => 5.0,
        ]);
        $this->assertDatabaseHas('retour_achat_line_lots', [
            'lot_number' => 'LOT-001',
            'quantity' => 5.0,
        ]);
    }

    public function test_cannot_return_more_than_received_qty()
    {
        $receptionLine1 = $this->reception->lines->first();

        $response = $this->actingAs($this->user)
            ->from(route('retours-achat.create'))
            ->post(route('retours-achat.store'), [
                'tier_id' => $this->fournisseur->id,
                'date_retour' => '2026-06-03',
                'devise_id' => $this->devise->id,
                'branche_id' => $this->branche->id,
                'lines' => [
                    [
                        'reception_line_id' => $receptionLine1->id,
                        'product_id' => $this->productWithLot->id,
                        'entrepot_id' => $this->entrepot->id,
                        'purchase_unit_id' => $this->unit->id,
                        'qty' => 15.0, // Exceeds 10 limit
                        'pu_ht' => 100.0,
                        'pu_ttc' => 120.0,
                        'taux_tva_id' => $this->tauxTva->id,
                        'remise' => 0,
                        'rm' => 0,
                        'lots' => [
                            [
                                'lot_number' => 'LOT-001',
                                'quantity' => 15.0,
                            ]
                        ]
                    ]
                ]
            ]);

        $response->assertRedirect(route('retours-achat.create'));
        $response->assertSessionHas('error');
    }

    public function test_can_validate_retour_achat_and_deduct_stock()
    {
        // 1. Create a draft return
        $receptionLine1 = $this->reception->lines->first();
        $retour = RetourAchat::create([
            'ref' => 'RTA-202606-0001',
            'tier_id' => $this->fournisseur->id,
            'date_retour' => '2026-06-03',
            'devise_id' => $this->devise->id,
            'status' => 'brouillon',
            'total_ht' => 500,
            'total_tva' => 100,
            'total_ttc' => 600,
        ]);

        $rLine = $retour->lines()->create([
            'reception_line_id' => $receptionLine1->id,
            'product_id' => $this->productWithLot->id,
            'entrepot_id' => $this->entrepot->id,
            'purchase_unit_id' => $this->unit->id,
            'qty' => 4.0,
            'pu_ht' => 100.0,
            'pu_ttc' => 120.0,
            'taux_tva_id' => $this->tauxTva->id,
            'remise' => 0,
            'rm' => 0,
            'total_ht' => 400,
            'total_ttc' => 480,
        ]);

        $rLine->lots()->create([
            'lot_number' => 'LOT-001',
            'quantity' => 4.0,
        ]);

        // 2. Validate the return
        $response = $this->actingAs($this->user)
            ->post(route('retours-achat.toggle-status', $retour->id), [
                'status' => 'valide',
            ]);

        $response->assertSessionHasNoErrors();
        $this->assertEquals('valide', $retour->fresh()->status);

        // 3. Assert stock has been deducted
        $productEntrepot = ProductEntrepot::where('product_id', $this->productWithLot->id)
            ->where('entrepot_id', $this->entrepot->id)
            ->first();
        $this->assertEquals(6.0, (float)$productEntrepot->quantity);

        $lot = ProductLot::where('entrepot_product_id', $productEntrepot->id)
            ->where('lot_number', 'LOT-001')
            ->first();
        $this->assertEquals(6.0, (float)$lot->quantity);
    }

    public function test_cannot_validate_if_insufficient_stock()
    {
        // 1. Create return for quantity that exceeds available warehouse stock (available = 10, return = 12, even if reception had 10, stock might have changed)
        // Let's set warehouse stock lower: e.g. 2.0
        $productEntrepot = ProductEntrepot::where('product_id', $this->productWithLot->id)
            ->where('entrepot_id', $this->entrepot->id)
            ->first();
        $productEntrepot->update(['quantity' => 2.0]);
        $lot = ProductLot::where('entrepot_product_id', $productEntrepot->id)->first();
        $lot->update(['quantity' => 2.0]);

        $receptionLine1 = $this->reception->lines->first();
        $retour = RetourAchat::create([
            'ref' => 'RTA-202606-0002',
            'tier_id' => $this->fournisseur->id,
            'date_retour' => '2026-06-03',
            'devise_id' => $this->devise->id,
            'status' => 'brouillon',
            'total_ht' => 500,
            'total_tva' => 100,
            'total_ttc' => 600,
        ]);

        $rLine = $retour->lines()->create([
            'reception_line_id' => $receptionLine1->id,
            'product_id' => $this->productWithLot->id,
            'entrepot_id' => $this->entrepot->id,
            'purchase_unit_id' => $this->unit->id,
            'qty' => 4.0, // Exceeds 2.0 available
            'pu_ht' => 100.0,
            'pu_ttc' => 120.0,
            'taux_tva_id' => $this->tauxTva->id,
            'remise' => 0,
            'rm' => 0,
            'total_ht' => 400,
            'total_ttc' => 480,
        ]);

        $rLine->lots()->create([
            'lot_number' => 'LOT-001',
            'quantity' => 4.0,
        ]);

        // 2. Validate
        $response = $this->actingAs($this->user)
            ->post(route('retours-achat.toggle-status', $retour->id), [
                'status' => 'valide',
            ]);

        // 3. Assert status is still draft because stock validation failed
        $this->assertEquals('brouillon', $retour->fresh()->status);
        $response->assertSessionHas('error');
    }

    public function test_cannot_change_status_of_validated_retour_achat()
    {
        $retour = RetourAchat::create([
            'ref' => 'RTA-202606-0003',
            'tier_id' => $this->fournisseur->id,
            'date_retour' => '2026-06-03',
            'devise_id' => $this->devise->id,
            'status' => 'valide',
            'total_ht' => 500,
            'total_tva' => 100,
            'total_ttc' => 600,
        ]);

        $response = $this->actingAs($this->user)
            ->post(route('retours-achat.toggle-status', $retour->id), [
                'status' => 'brouillon',
            ]);

        $response->assertSessionHas('error');
        $this->assertEquals('valide', $retour->fresh()->status);
    }

    public function test_cannot_change_status_of_cancelled_retour_achat()
    {
        $retour = RetourAchat::create([
            'ref' => 'RTA-202606-0004',
            'tier_id' => $this->fournisseur->id,
            'date_retour' => '2026-06-03',
            'devise_id' => $this->devise->id,
            'status' => 'annule',
            'total_ht' => 500,
            'total_tva' => 100,
            'total_ttc' => 600,
        ]);

        $response = $this->actingAs($this->user)
            ->post(route('retours-achat.toggle-status', $retour->id), [
                'status' => 'brouillon',
            ]);

        $response->assertSessionHas('error');
        $this->assertEquals('annule', $retour->fresh()->status);
    }
}
