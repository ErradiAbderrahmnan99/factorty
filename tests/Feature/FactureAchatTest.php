<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Tier;
use App\Models\Product;
use App\Models\Devise;
use App\Models\Unit;
use App\Models\UnitCategory;
use App\Models\FactureAchat;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FactureAchatTest extends TestCase
{
    use RefreshDatabase;

    private $user;
    private $fournisseur;
    private $devise;
    private $unit;
    private $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();

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
    }

    public function test_can_view_facture_achat_index()
    {
        $response = $this->actingAs($this->user)
            ->get(route('factures-achat.index'));

        $response->assertStatus(200);
    }

    public function test_can_store_facture_achat_as_brouillon()
    {
        $postData = [
            'tier_id'       => $this->fournisseur->id,
            'date_facture'  => '2026-06-01',
            'date_echeance' => '2026-06-30',
            'devise_id'     => $this->devise->id,
            'lines'         => [
                [
                    'product_id'       => $this->product->id,
                    'purchase_unit_id' => $this->unit->id,
                    'tva'              => 20.00,
                    'qty'              => 10,
                    'pu_ht'            => 150.00,
                    'pu_ttc'           => 180.00,
                    'remise'           => 10.00,
                    'rm'               => 0.00,
                ]
            ]
        ];

        $response = $this->actingAs($this->user)
            ->post(route('factures-achat.store'), $postData);

        $response->assertRedirect(route('factures-achat.index'));

        $this->assertDatabaseHas('factures_achat', [
            'tier_id'      => $this->fournisseur->id,
            'status'       => 'brouillon',
            'total_ht'     => 1350.00, // 10 * 150 = 1500; -10% discount = 1350
            'total_ttc'    => 1620.00, // 1350 * 1.2 = 1620
        ]);

        $this->assertDatabaseHas('facture_achat_lines', [
            'product_id' => $this->product->id,
            'qty'        => 10,
            'pu_ht'      => 150.00,
            'total_ht'   => 1350.00,
            'total_ttc'  => 1620.00,
        ]);
    }

    public function test_can_update_brouillon_facture_achat()
    {
        $facture = FactureAchat::create([
            'ref'          => 'FA-202606-0001',
            'tier_id'      => $this->fournisseur->id,
            'date_facture' => '2026-06-01',
            'devise_id'    => $this->devise->id,
            'status'       => 'brouillon',
            'total_ht'     => 150.00,
            'total_ttc'    => 180.00,
        ]);

        $facture->lines()->create([
            'product_id'       => $this->product->id,
            'purchase_unit_id' => $this->unit->id,
            'tva'              => 20.00,
            'qty'              => 1,
            'pu_ht'            => 150.00,
            'pu_ttc'           => 180.00,
            'total_ht'         => 150.00,
            'total_ttc'        => 180.00,
        ]);

        $updateData = [
            'tier_id'       => $this->fournisseur->id,
            'date_facture'  => '2026-06-02',
            'date_echeance' => '2026-06-25',
            'devise_id'     => $this->devise->id,
            'lines'         => [
                [
                    'product_id'       => $this->product->id,
                    'purchase_unit_id' => $this->unit->id,
                    'tva'              => 20.00,
                    'qty'              => 5,
                    'pu_ht'            => 140.00,
                    'pu_ttc'           => 168.00,
                    'remise'           => 0.00,
                    'rm'               => 20.00,
                ]
            ]
        ];

        $response = $this->actingAs($this->user)
            ->put(route('factures-achat.update', $facture->id), $updateData);

        $response->assertRedirect(route('factures-achat.index'));

        $this->assertDatabaseHas('factures_achat', [
            'id'           => $facture->id,
            'date_facture' => '2026-06-02',
            'total_ht'     => 680.00, // 5 * 140 = 700; -20 RM = 680
            'total_ttc'    => 816.00, // 680 * 1.2 = 816
        ]);
    }

    public function test_cannot_update_payee_or_annulee_facture_achat()
    {
        $facture = FactureAchat::create([
            'ref'          => 'FA-202606-0002',
            'tier_id'      => $this->fournisseur->id,
            'date_facture' => '2026-06-01',
            'devise_id'    => $this->devise->id,
            'status'       => 'payee',
            'total_ht'     => 150.00,
            'total_ttc'    => 180.00,
        ]);

        $updateData = [
            'tier_id'       => $this->fournisseur->id,
            'date_facture'  => '2026-06-02',
            'devise_id'     => $this->devise->id,
            'lines'         => [
                [
                    'product_id'       => $this->product->id,
                    'purchase_unit_id' => $this->unit->id,
                    'tva'              => 20.00,
                    'qty'              => 5,
                    'pu_ht'            => 140.00,
                    'pu_ttc'           => 168.00,
                ]
            ]
        ];

        $response = $this->actingAs($this->user)
            ->from(route('factures-achat.edit', $facture->id))
            ->put(route('factures-achat.update', $facture->id), $updateData);

        $response->assertRedirect(route('factures-achat.edit', $facture->id));
        $response->assertSessionHas('error', 'Cette facture ne peut plus être modifiée.');

        $this->assertEquals('payee', $facture->fresh()->status);
    }

    public function test_can_toggle_status_to_payee_or_annulee()
    {
        $facture = FactureAchat::create([
            'ref'          => 'FA-202606-0003',
            'tier_id'      => $this->fournisseur->id,
            'date_facture' => '2026-06-01',
            'devise_id'    => $this->devise->id,
            'status'       => 'brouillon',
            'total_ht'     => 150.00,
            'total_ttc'    => 180.00,
        ]);

        $response = $this->actingAs($this->user)
            ->post(route('factures-achat.toggle-status', $facture->id), ['status' => 'payee']);

        $response->assertSessionHas('success');
        $this->assertEquals('payee', $facture->fresh()->status);
    }

    public function test_cannot_change_status_after_locked()
    {
        $facture = FactureAchat::create([
            'ref'          => 'FA-202606-0004',
            'tier_id'      => $this->fournisseur->id,
            'date_facture' => '2026-06-01',
            'devise_id'    => $this->devise->id,
            'status'       => 'payee',
            'total_ht'     => 150.00,
            'total_ttc'    => 180.00,
        ]);

        $response = $this->actingAs($this->user)
            ->post(route('factures-achat.toggle-status', $facture->id), ['status' => 'brouillon']);

        $response->assertSessionHas('error', 'Une facture payée ne peut plus changer de statut.');
        $this->assertEquals('payee', $facture->fresh()->status);
    }

    public function test_can_delete_brouillon_facture_achat()
    {
        $facture = FactureAchat::create([
            'ref'          => 'FA-202606-0005',
            'tier_id'      => $this->fournisseur->id,
            'date_facture' => '2026-06-01',
            'devise_id'    => $this->devise->id,
            'status'       => 'brouillon',
            'total_ht'     => 150.00,
            'total_ttc'    => 180.00,
        ]);

        $response = $this->actingAs($this->user)
            ->delete(route('factures-achat.destroy', $facture->id));

        $response->assertRedirect(route('factures-achat.index'));
        $this->assertDatabaseMissing('factures_achat', ['id' => $facture->id]);
    }

    public function test_cannot_delete_payee_facture_achat()
    {
        $facture = FactureAchat::create([
            'ref'          => 'FA-202606-0006',
            'tier_id'      => $this->fournisseur->id,
            'date_facture' => '2026-06-01',
            'devise_id'    => $this->devise->id,
            'status'       => 'payee',
            'total_ht'     => 150.00,
            'total_ttc'    => 180.00,
        ]);

        $response = $this->actingAs($this->user)
            ->from(route('factures-achat.index'))
            ->delete(route('factures-achat.destroy', $facture->id));

        $response->assertRedirect(route('factures-achat.index'));
        $response->assertSessionHas('error', 'Une facture payée ne peut pas être supprimée.');
        $this->assertDatabaseHas('factures_achat', ['id' => $facture->id]);
    }
}
