<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Tier;
use App\Models\Product;
use App\Models\Devise;
use App\Models\Unit;
use App\Models\UnitCategory;
use App\Models\Commande;
use App\Models\Entrepot;
use App\Models\Livraison;
use App\Models\FactureVente;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LivraisonToFactureTest extends TestCase
{
    use RefreshDatabase;

    private $user;
    private $client;
    private $devise;
    private $unit;
    private $product;
    private $entrepot;
    private $livraison;

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

        $this->livraison = Livraison::create([
            'ref'            => 'BL-202606-0001',
            'tier_id'        => $this->client->id,
            'date_livraison' => '2026-06-01',
            'devise_id'      => $this->devise->id,
            'status'         => 'valide',
            'total_ht'       => 200.00,
            'total_ttc'      => 240.00,
        ]);

        $this->livraison->lines()->create([
            'product_id'   => $this->product->id,
            'entrepot_id'  => $this->entrepot->id,
            'sale_unit_id' => $this->unit->id,
            'tva'          => 20.00,
            'qty'          => 10,
            'pu_ht'        => 20.00,
            'pu_ttc'       => 24.00,
            'total_ht'     => 200.00,
            'total_ttc'    => 240.00,
        ]);
    }

    public function test_can_fetch_livraison_with_lines_api()
    {
        $response = $this->actingAs($this->user)
            ->get("/api/livraisons/{$this->livraison->id}");

        $response->assertStatus(200);
        $response->assertJsonPath('ref', $this->livraison->ref);
        $response->assertJsonCount(1, 'lines');
        $response->assertJsonPath('lines.0.invoiced_qty', 0);
    }

    public function test_can_convert_livraison_to_facture_fully()
    {
        $postData = [
            'tier_id'       => $this->client->id,
            'date_facture'  => '2026-06-01',
            'devise_id'     => $this->devise->id,
            'livraison_id'  => $this->livraison->id,
            'lines'         => [
                [
                    'product_id'   => $this->product->id,
                    'sale_unit_id' => $this->unit->id,
                    'tva'          => 20.00,
                    'qty'          => 10,
                    'pu_ht'        => 20.00,
                    'pu_ttc'       => 24.00,
                    'remise'       => 0,
                    'rm'           => 0,
                ]
            ]
        ];

        $response = $this->actingAs($this->user)
            ->post(route('factures-vente.store'), $postData);

        $response->assertRedirect(route('factures-vente.index'));

        $this->assertDatabaseHas('factures_vente', [
            'tier_id'      => $this->client->id,
            'livraison_id' => $this->livraison->id,
            'total_ht'     => 200.00,
            'total_ttc'    => 240.00,
        ]);

        $this->assertEquals('facturé', $this->livraison->fresh()->status);
    }

    public function test_can_convert_livraison_to_facture_partially()
    {
        $postData = [
            'tier_id'       => $this->client->id,
            'date_facture'  => '2026-06-01',
            'devise_id'     => $this->devise->id,
            'livraison_id'  => $this->livraison->id,
            'lines'         => [
                [
                    'product_id'   => $this->product->id,
                    'sale_unit_id' => $this->unit->id,
                    'tva'          => 20.00,
                    'qty'          => 4,
                    'pu_ht'        => 20.00,
                    'pu_ttc'       => 24.00,
                    'remise'       => 0,
                    'rm'           => 0,
                ]
            ]
        ];

        $response = $this->actingAs($this->user)
            ->post(route('factures-vente.store'), $postData);

        $response->assertRedirect(route('factures-vente.index'));

        $this->assertEquals('facturé partiellement', $this->livraison->fresh()->status);
    }

    public function test_cannot_exceed_remaining_quantity()
    {
        $postData = [
            'tier_id'       => $this->client->id,
            'date_facture'  => '2026-06-01',
            'devise_id'     => $this->devise->id,
            'livraison_id'  => $this->livraison->id,
            'lines'         => [
                [
                    'product_id'   => $this->product->id,
                    'sale_unit_id' => $this->unit->id,
                    'tva'          => 20.00,
                    'qty'          => 11, // Exceeds 10
                    'pu_ht'        => 20.00,
                    'pu_ttc'       => 24.00,
                    'remise'       => 0,
                    'rm'           => 0,
                ]
            ]
        ];

        $response = $this->actingAs($this->user)
            ->from(route('livraisons.index'))
            ->post(route('factures-vente.store'), $postData);

        $response->assertRedirect(route('livraisons.index'));
        $response->assertSessionHasErrors(['lines.0.qty']);
    }

    public function test_can_delete_facture_and_revert_livraison_status()
    {
        $facture = FactureVente::create([
            'ref'          => 'FV-202606-0001',
            'tier_id'      => $this->client->id,
            'date_facture' => '2026-06-01',
            'devise_id'    => $this->devise->id,
            'livraison_id' => $this->livraison->id,
            'status'       => 'brouillon',
            'total_ht'     => 200.00,
            'total_ttc'    => 240.00,
        ]);

        $this->livraison->update(['status' => 'facturé']);

        $response = $this->actingAs($this->user)
            ->delete(route('factures-vente.destroy', $facture->id));

        $response->assertRedirect(route('factures-vente.index'));
        $this->assertEquals('valide', $this->livraison->fresh()->status);
    }

    public function test_cannot_change_status_of_invoiced_livraison()
    {
        $this->livraison->update(['status' => 'facturé']);

        $response = $this->actingAs($this->user)
            ->post(route('livraisons.toggle-status', $this->livraison->id), [
                'status' => 'brouillon',
            ]);

        $response->assertSessionHas('error', 'Un bon de livraison déjà validé ou facturé ne peut plus être modifié.');
        $this->assertEquals('facturé', $this->livraison->fresh()->status);
    }

    public function test_cannot_edit_invoiced_livraison()
    {
        $this->livraison->update(['status' => 'facturé partiellement']);

        $response = $this->actingAs($this->user)
            ->put(route('livraisons.update', $this->livraison->id), [
                'tier_id'        => $this->client->id,
                'date_livraison' => '2026-06-01',
                'devise_id'      => $this->devise->id,
                'lines'          => [
                    [
                        'product_id'  => $this->product->id,
                        'entrepot_id' => $this->entrepot->id,
                        'qty'         => 5,
                        'pu_ht'       => 20.00,
                        'pu_ttc'      => 24.00,
                    ]
                ]
            ]);

        $response->assertSessionHas('error', 'Un bon de livraison déjà validé ou facturé ne peut pas être modifié.');
    }
}
