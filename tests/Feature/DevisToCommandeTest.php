<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Tier;
use App\Models\Product;
use App\Models\Devise;
use App\Models\Unit;
use App\Models\UnitCategory;
use App\Models\Devis;
use App\Models\Entrepot;
use App\Models\Commande;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DevisToCommandeTest extends TestCase
{
    use RefreshDatabase;

    private $user;
    private $client;
    private $devise;
    private $unit;
    private $product;
    private $entrepot;
    private $devis;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();

        $this->client = Tier::create([
            'type'   => 'client',
            'ref'    => 'CLI-TEST',
            'label'  => 'Test Client',
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
            'code'             => 'KG',
            'label'            => 'Kilogramme',
            'ratio'            => 1.0,
        ]);

        $this->product = Product::create([
            'ref'            => 'PROD-001',
            'label'          => 'Test Product',
            'sale_unit_id'   => $this->unit->id,
            'stock_unit_id'  => $this->unit->id,
            'purchase_price' => 150.00,
            'sale_price'     => 200.00,
            'status'         => 'actif',
            'manage_by_lot'  => false,
        ]);

        $this->entrepot = Entrepot::create([
            'code'  => 'ENT-001',
            'label' => 'Entrepôt Principal',
        ]);

        $this->devis = Devis::create([
            'ref'            => 'DEV-202606-0001',
            'tier_id'        => $this->client->id,
            'date_devis'     => '2026-06-01',
            'duree_validite' => 30,
            'devise_id'      => $this->devise->id,
            'status'         => 'accepté',
            'total_ht'       => 200.00,
            'total_tva'      => 40.00,
            'total_ttc'      => 240.00,
        ]);

        $this->devis->lines()->create([
            'product_id'   => $this->product->id,
            'sale_unit_id' => $this->unit->id,
            'tva'          => 20.00,
            'qty'          => 1,
            'pu_ht'        => 200.00,
            'pu_ttc'       => 240.00,
            'total_ht'     => 200.00,
            'total_ttc'    => 240.00,
        ]);
    }

    public function test_can_fetch_devis_with_lines_api()
    {
        $response = $this->actingAs($this->user)
            ->get("/api/devis/{$this->devis->id}");

        $response->assertStatus(200);
        $response->assertJsonPath('ref', $this->devis->ref);
        $response->assertJsonCount(1, 'lines');
        $response->assertJsonPath('lines.0.product.id', $this->product->id);
    }

    public function test_can_convert_devis_to_commande()
    {
        $postData = [
            'tier_id'       => $this->client->id,
            'commercial'    => 'John Doe',
            'date_commande' => '2026-06-01',
            'devise_id'     => $this->devise->id,
            'devis_id'      => $this->devis->id,
            'lines'         => [
                [
                    'product_id'   => $this->product->id,
                    'entrepot_id'  => $this->entrepot->id,
                    'sale_unit_id' => $this->unit->id,
                    'tva'          => 20.00,
                    'qty'          => 1,
                    'pu_ht'        => 200.00,
                    'pu_ttc'       => 240.00,
                    'remise'       => 0,
                    'rm'           => 0,
                    'lots'         => [],
                ]
            ]
        ];

        $response = $this->actingAs($this->user)
            ->post(route('commandes.store'), $postData);

        $response->assertRedirect(route('commandes.index'));

        $this->assertDatabaseHas('commandes', [
            'tier_id'        => $this->client->id,
            'commercial'     => 'John Doe',
            'date_commande'  => '2026-06-01',
            'devise_id'      => $this->devise->id,
            'devis_id'       => $this->devis->id,
            'total_ht'       => 200.00,
            'total_ttc'      => 240.00,
        ]);

        $this->assertDatabaseHas('commande_lines', [
            'product_id'  => $this->product->id,
            'entrepot_id' => $this->entrepot->id,
            'qty'         => 1,
            'pu_ht'       => 200.00,
        ]);

        $this->assertEquals('commandé', $this->devis->fresh()->status);
    }

    public function test_can_delete_commande_and_restore_devis_status_to_accepte()
    {
        $commande = Commande::create([
            'ref'           => 'CC-202606-0001',
            'tier_id'       => $this->client->id,
            'date_commande' => '2026-06-01',
            'devise_id'     => $this->devise->id,
            'devis_id'      => $this->devis->id,
            'status'        => 'brouillon',
            'total_ht'      => 200.00,
            'total_ttc'     => 240.00,
        ]);

        $this->devis->update(['status' => 'commandé']);

        $response = $this->actingAs($this->user)
            ->delete(route('commandes.destroy', $commande->id));

        $response->assertRedirect(route('commandes.index'));
        $this->assertDatabaseMissing('commandes', ['id' => $commande->id]);
        $this->assertEquals('accepté', $this->devis->fresh()->status);
    }

    public function test_can_create_multiple_commandes_from_same_devis()
    {
        $this->devis->update(['status' => 'accepté']);

        // Create first Commande
        $commande1 = Commande::create([
            'ref'           => 'CC-202606-0001',
            'tier_id'       => $this->client->id,
            'date_commande' => '2026-06-01',
            'devise_id'     => $this->devise->id,
            'devis_id'      => $this->devis->id,
            'status'        => 'brouillon',
            'total_ht'      => 100.00,
            'total_ttc'     => 120.00,
        ]);
        $commande1->lines()->create([
            'product_id'    => $this->product->id,
            'entrepot_id'   => $this->entrepot->id,
            'sale_unit_id'  => $this->unit->id,
            'tva'           => 20.00,
            'qty'           => 0.5,
            'pu_ht'         => 200.00,
            'pu_ttc'        => 240.00,
            'total_ht'      => 100.00,
            'total_ttc'     => 120.00,
            'devis_line_id' => $this->devis->lines->first()->id,
        ]);

        $this->devis->recalculateOrderStatus();

        // Create second Commande
        $commande2 = Commande::create([
            'ref'           => 'CC-202606-0002',
            'tier_id'       => $this->client->id,
            'date_commande' => '2026-06-01',
            'devise_id'     => $this->devise->id,
            'devis_id'      => $this->devis->id,
            'status'        => 'brouillon',
            'total_ht'      => 100.00,
            'total_ttc'     => 120.00,
        ]);
        $commande2->lines()->create([
            'product_id'    => $this->product->id,
            'entrepot_id'   => $this->entrepot->id,
            'sale_unit_id'  => $this->unit->id,
            'tva'           => 20.00,
            'qty'           => 0.5,
            'pu_ht'         => 200.00,
            'pu_ttc'        => 240.00,
            'total_ht'      => 100.00,
            'total_ttc'     => 120.00,
            'devis_line_id' => $this->devis->lines->first()->id,
        ]);

        $this->devis->recalculateOrderStatus();

        $this->assertEquals('commandé', $this->devis->fresh()->status);

        // Delete first Commande - devis status should become 'commandé partiellement' because $commande2 is still linked with 0.5 qty
        $this->actingAs($this->user)->delete(route('commandes.destroy', $commande1->id));
        $this->assertEquals('commandé partiellement', $this->devis->fresh()->status);

        // Delete second Commande - devis status should revert to 'accepté'
        $this->actingAs($this->user)->delete(route('commandes.destroy', $commande2->id));
        $this->assertEquals('accepté', $this->devis->fresh()->status);
    }
}
