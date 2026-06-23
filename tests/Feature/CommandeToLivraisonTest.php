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
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommandeToLivraisonTest extends TestCase
{
    use RefreshDatabase;

    private $user;
    private $client;
    private $devise;
    private $unit;
    private $product;
    private $entrepot;
    private $commande;
    private $tauxTva;

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

        $this->commande = Commande::create([
            'ref'           => 'CC-202606-0001',
            'tier_id'       => $this->client->id,
            'date_commande' => '2026-06-01',
            'devise_id'     => $this->devise->id,
            'status'        => 'valide',
            'total_ht'      => 200.00,
            'total_tva'     => 40.00,
            'total_ttc'     => 240.00,
        ]);

        $this->commande->lines()->create([
            'product_id'   => $this->product->id,
            'entrepot_id'  => $this->entrepot->id,
            'sale_unit_id' => $this->unit->id,
            'taux_tva_id'  => $this->tauxTva->id,
            'qty'          => 1,
            'pu_ht'        => 200.00,
            'pu_ttc'       => 240.00,
            'total_ht'     => 200.00,
            'total_ttc'    => 240.00,
        ]);
    }

    public function test_can_fetch_commande_with_lines_api()
    {
        $response = $this->actingAs($this->user)
            ->get("/api/commandes/{$this->commande->id}");

        $response->assertStatus(200);
        $response->assertJsonPath('ref', $this->commande->ref);
        $response->assertJsonCount(1, 'lines');
        $response->assertJsonPath('lines.0.product.id', $this->product->id);
    }

    public function test_can_convert_commande_to_livraison()
    {
        $postData = [
            'tier_id'        => $this->client->id,
            'commercial'     => 'John Doe',
            'date_livraison' => '2026-06-01',
            'devise_id'      => $this->devise->id,
            'commande_id'    => $this->commande->id,
            'lines'          => [
                [
                    'commande_line_id' => $this->commande->lines->first()->id,
                    'product_id'   => $this->product->id,
                    'entrepot_id'  => $this->entrepot->id,
                    'sale_unit_id' => $this->unit->id,
                    'taux_tva_id'  => $this->tauxTva->id,
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
            ->post(route('livraisons.store'), $postData);

        $response->assertRedirect(route('livraisons.index'));

        $this->assertDatabaseHas('livraisons', [
            'tier_id'        => $this->client->id,
            'commercial'     => 'John Doe',
            'date_livraison' => '2026-06-01',
            'devise_id'      => $this->devise->id,
            'commande_id'    => $this->commande->id,
            'total_ht'       => 200.00,
            'total_ttc'      => 240.00,
        ]);

        $this->assertDatabaseHas('livraison_lines', [
            'product_id'  => $this->product->id,
            'entrepot_id' => $this->entrepot->id,
            'qty'         => 1,
            'pu_ht'       => 200.00,
        ]);

        $this->assertEquals('livré', $this->commande->fresh()->status);
    }

    public function test_can_delete_livraison_and_restore_commande_status_to_valide()
    {
        $livraison = Livraison::create([
            'ref'            => 'BL-202606-0001',
            'tier_id'        => $this->client->id,
            'date_livraison' => '2026-06-01',
            'devise_id'      => $this->devise->id,
            'commande_id'    => $this->commande->id,
            'status'         => 'brouillon',
            'total_ht'       => 200.00,
            'total_ttc'      => 240.00,
        ]);

        $this->commande->update(['status' => 'livré']);

        $response = $this->actingAs($this->user)
            ->delete(route('livraisons.destroy', $livraison->id));

        $response->assertRedirect(route('livraisons.index'));
        $this->assertDatabaseMissing('livraisons', ['id' => $livraison->id]);
        $this->assertEquals('valide', $this->commande->fresh()->status);
    }

    public function test_can_create_multiple_livraisons_from_same_commande()
    {
        $this->commande->update(['status' => 'valide']);

        // Create first Livraison
        $livraison1 = Livraison::create([
            'ref'            => 'BL-202606-0001',
            'tier_id'        => $this->client->id,
            'date_livraison' => '2026-06-01',
            'devise_id'      => $this->devise->id,
            'commande_id'    => $this->commande->id,
            'status'         => 'brouillon',
            'total_ht'       => 100.00,
            'total_ttc'      => 120.00,
        ]);
        $livraison1->lines()->create([
            'commande_line_id' => $this->commande->lines->first()->id,
            'product_id'   => $this->product->id,
            'entrepot_id'  => $this->entrepot->id,
            'sale_unit_id' => $this->unit->id,
            'taux_tva_id'  => $this->tauxTva->id,
            'qty'          => 0.5,
            'pu_ht'        => 200.00,
            'pu_ttc'       => 240.00,
            'total_ht'     => 100.00,
            'total_ttc'    => 120.00,
        ]);

        // Create second Livraison
        $livraison2 = Livraison::create([
            'ref'            => 'BL-202606-0002',
            'tier_id'        => $this->client->id,
            'date_livraison' => '2026-06-01',
            'devise_id'      => $this->devise->id,
            'commande_id'    => $this->commande->id,
            'status'         => 'brouillon',
            'total_ht'       => 100.00,
            'total_ttc'      => 120.00,
        ]);
        $livraison2->lines()->create([
            'commande_line_id' => $this->commande->lines->first()->id,
            'product_id'   => $this->product->id,
            'entrepot_id'  => $this->entrepot->id,
            'sale_unit_id' => $this->unit->id,
            'taux_tva_id'  => $this->tauxTva->id,
            'qty'          => 0.5,
            'pu_ht'        => 200.00,
            'pu_ttc'       => 240.00,
            'total_ht'     => 100.00,
            'total_ttc'    => 120.00,
        ]);

        $this->commande->recalculateDeliveryStatus();
        $this->assertEquals('livré', $this->commande->fresh()->status);

        // Delete first Livraison - commande status should become 'livré partiellement' because $livraison2 is still linked (0.5 qty)
        $this->actingAs($this->user)->delete(route('livraisons.destroy', $livraison1->id));
        $this->assertEquals('livré partiellement', $this->commande->fresh()->status);

        // Delete second Livraison - commande status should revert to 'valide'
        $this->actingAs($this->user)->delete(route('livraisons.destroy', $livraison2->id));
        $this->assertEquals('valide', $this->commande->fresh()->status);
    }

    public function test_cannot_update_status_of_livre_commande()
    {
        $this->commande->update(['status' => 'livré']);

        $response = $this->actingAs($this->user)
            ->post(route('commandes.toggle-status', $this->commande->id), [
                'status' => 'brouillon',
            ]);

        $response->assertSessionHas('error', 'Le statut d\'une commande livrée ne peut pas être modifié.');
        $this->assertEquals('livré', $this->commande->fresh()->status);
    }
}
