<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Tier;
use App\Models\Product;
use App\Models\Devise;
use App\Models\Unit;
use App\Models\UnitCategory;
use App\Models\FactureAchat;
use App\Models\AvoirAchat;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AvoirAchatTest extends TestCase
{
    use RefreshDatabase;

    private $user;
    private $fournisseur;
    private $devise;
    private $unit;
    private $product;
    private $facture;
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
            'type'   => 'fournisseur',
            'ref'    => 'FOU-TEST',
            'label'  => 'Test Supplier',
            'status' => 'actif',
        ]);

        $this->devise = Devise::create([
            'code'   => 'MAD',
            'label'  => 'Dirham Marocain',
            'symbol' => 'DH',
        ]);

        $unitCategory = UnitCategory::create([
            'code'  => 'UNIT-MAS',
            'label' => 'Masse',
        ]);

        $this->unit = Unit::create([
            'unit_category_id' => $unitCategory->id,
            'code'             => 'U',
            'label'            => 'Unité',
            'ratio'            => 1.0,
        ]);

        $this->product = Product::create([
            'ref'              => 'PROD-001',
            'label'            => 'Test Product',
            'purchase_unit_id' => $this->unit->id,
            'stock_unit_id'    => $this->unit->id,
            'purchase_price'   => 150.00,
            'sale_price'       => 200.00,
            'status'           => 'actif',
        ]);

        $this->facture = FactureAchat::create([
            'ref'          => 'FA-202606-0001',
            'tier_id'      => $this->fournisseur->id,
            'date_facture' => '2026-06-01',
            'devise_id'    => $this->devise->id,
            'status'       => 'brouillon',
            'total_ht'     => 150.00,
            'total_ttc'    => 180.00,
        ]);
    }

    public function test_can_view_avoir_achat_index()
    {
        $response = $this->actingAs($this->user)
            ->get(route('avoirs-achat.index'));

        $response->assertStatus(200);
    }

    public function test_can_store_avoir_achat_as_brouillon()
    {
        $postData = [
            'tier_id'          => $this->fournisseur->id,
            'facture_achat_id' => $this->facture->id,
            'date_avoir'       => '2026-06-01',
            'devise_id'        => $this->devise->id,
            'branche_id'       => $this->branche->id,
            'lines'            => [
                [
                    'product_id'       => $this->product->id,
                    'purchase_unit_id' => $this->unit->id,
                    'taux_tva_id'      => $this->tauxTva->id,
                    'qty'              => 2,
                    'pu_ht'            => 150.00,
                    'pu_ttc'           => 180.00,
                    'remise'           => 10.00,
                    'rm'               => 0.00,
                ]
            ]
        ];

        $response = $this->actingAs($this->user)
            ->post(route('avoirs-achat.store'), $postData);

        $response->assertRedirect(route('avoirs-achat.index'));

        $this->assertDatabaseHas('avoirs_achat', [
            'tier_id'          => $this->fournisseur->id,
            'facture_achat_id' => $this->facture->id,
            'status'           => 'brouillon',
            'total_ht'         => 270.00, // 2 * 150 = 300; -10% discount = 270
            'total_ttc'        => 324.00, // 270 * 1.2 = 324
        ]);

        $this->assertDatabaseHas('avoir_achat_lines', [
            'product_id' => $this->product->id,
            'qty'        => 2,
            'pu_ht'      => 150.00,
            'total_ht'   => 270.00,
            'total_ttc'  => 324.00,
        ]);
    }

    public function test_can_update_brouillon_avoir_achat()
    {
        $avoir = AvoirAchat::create([
            'ref'        => 'AVA-202606-0001',
            'tier_id'    => $this->fournisseur->id,
            'date_avoir' => '2026-06-01',
            'devise_id'  => $this->devise->id,
            'status'     => 'brouillon',
            'total_ht'   => 150.00,
            'total_ttc'  => 180.00,
        ]);

        $avoir->lines()->create([
            'product_id'       => $this->product->id,
            'purchase_unit_id' => $this->unit->id,
            'taux_tva_id'      => $this->tauxTva->id,
            'qty'              => 1,
            'pu_ht'            => 150.00,
            'pu_ttc'           => 180.00,
            'total_ht'         => 150.00,
            'total_ttc'        => 180.00,
        ]);

        $updateData = [
            'tier_id'    => $this->fournisseur->id,
            'date_avoir' => '2026-06-02',
            'devise_id'  => $this->devise->id,
            'branche_id' => $this->branche->id,
            'lines'      => [
                [
                    'product_id'       => $this->product->id,
                    'purchase_unit_id' => $this->unit->id,
                    'taux_tva_id'      => $this->tauxTva->id,
                    'qty'              => 5,
                    'pu_ht'            => 140.00,
                    'pu_ttc'           => 168.00,
                    'remise'           => 0.00,
                    'rm'               => 20.00,
                ]
            ]
        ];

        $response = $this->actingAs($this->user)
            ->put(route('avoirs-achat.update', $avoir->id), $updateData);

        $response->assertRedirect(route('avoirs-achat.index'));

        $this->assertDatabaseHas('avoirs_achat', [
            'id'         => $avoir->id,
            'date_avoir' => '2026-06-02',
            'total_ht'   => 680.00, // 5 * 140 = 700; -20 RM = 680
            'total_ttc'  => 816.00, // 680 * 1.2 = 816
        ]);
    }

    public function test_cannot_update_valide_avoir_achat()
    {
        $avoir = AvoirAchat::create([
            'ref'        => 'AVA-202606-0002',
            'tier_id'    => $this->fournisseur->id,
            'date_avoir' => '2026-06-01',
            'devise_id'  => $this->devise->id,
            'status'     => 'valide',
            'total_ht'   => 150.00,
            'total_ttc'  => 180.00,
        ]);

        $updateData = [
            'tier_id'    => $this->fournisseur->id,
            'date_avoir' => '2026-06-02',
            'devise_id'  => $this->devise->id,
            'branche_id' => $this->branche->id,
            'lines'      => [
                [
                    'product_id'       => $this->product->id,
                    'purchase_unit_id' => $this->unit->id,
                    'taux_tva_id'      => $this->tauxTva->id,
                    'qty'              => 5,
                    'pu_ht'            => 140.00,
                    'pu_ttc'           => 168.00,
                ]
            ]
        ];

        $response = $this->actingAs($this->user)
            ->from(route('avoirs-achat.edit', $avoir->id))
            ->put(route('avoirs-achat.update', $avoir->id), $updateData);

        $response->assertRedirect(route('avoirs-achat.edit', $avoir->id));
        $response->assertSessionHas('error', 'Cet avoir ne peut plus être modifié.');

        $this->assertEquals('valide', $avoir->fresh()->status);
    }

    public function test_can_toggle_status()
    {
        $avoir = AvoirAchat::create([
            'ref'        => 'AVA-202606-0003',
            'tier_id'    => $this->fournisseur->id,
            'date_avoir' => '2026-06-01',
            'devise_id'  => $this->devise->id,
            'status'     => 'brouillon',
            'total_ht'   => 150.00,
            'total_ttc'  => 180.00,
        ]);

        $response = $this->actingAs($this->user)
            ->post(route('avoirs-achat.toggle-status', $avoir->id), ['status' => 'valide']);

        $response->assertSessionHas('success');
        $this->assertEquals('valide', $avoir->fresh()->status);
    }

    public function test_can_delete_brouillon_avoir_achat()
    {
        $avoir = AvoirAchat::create([
            'ref'        => 'AVA-202606-0004',
            'tier_id'    => $this->fournisseur->id,
            'date_avoir' => '2026-06-01',
            'devise_id'  => $this->devise->id,
            'status'     => 'brouillon',
            'total_ht'   => 150.00,
            'total_ttc'  => 180.00,
        ]);

        $response = $this->actingAs($this->user)
            ->delete(route('avoirs-achat.destroy', $avoir->id));

        $response->assertRedirect(route('avoirs-achat.index'));
        $this->assertDatabaseMissing('avoirs_achat', ['id' => $avoir->id]);
    }

    public function test_cannot_delete_valide_avoir_achat()
    {
        $avoir = AvoirAchat::create([
            'ref'        => 'AVA-202606-0005',
            'tier_id'    => $this->fournisseur->id,
            'date_avoir' => '2026-06-01',
            'devise_id'  => $this->devise->id,
            'status'     => 'valide',
            'total_ht'   => 150.00,
            'total_ttc'  => 180.00,
        ]);

        $response = $this->actingAs($this->user)
            ->from(route('avoirs-achat.index'))
            ->delete(route('avoirs-achat.destroy', $avoir->id));

        $response->assertRedirect(route('avoirs-achat.index'));
        $response->assertSessionHas('error', 'Un avoir validé ou payé ne peut pas être supprimé.');
        $this->assertDatabaseHas('avoirs_achat', ['id' => $avoir->id]);
    }
}
