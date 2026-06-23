<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Tier;
use App\Models\Product;
use App\Models\Devise;
use App\Models\Unit;
use App\Models\UnitCategory;
use App\Models\DemandePrix;
use App\Models\TauxTva;
use App\Models\Branche;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DemandePrixTest extends TestCase
{
    use RefreshDatabase;

    private $user;
    private $fournisseur;
    private $devise;
    private $unit;
    private $product;
    private $tauxTva;
    private $branche;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();

        $this->tauxTva = TauxTva::create([
            'code' => 'TVA20',
            'libelle' => 'TVA 20%',
            'taux' => 20.00,
            'actif' => true,
        ]);

        $this->branche = Branche::create([
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
    }

    private function createDemandePrix($status = 'brouillon')
    {
        $dp = DemandePrix::create([
            'ref'          => 'DP-202606-0001',
            'tier_id'      => $this->fournisseur->id,
            'date_demande' => '2026-06-01',
            'devise_id'    => $this->devise->id,
            'branche_id'   => $this->branche->id,
            'status'       => $status,
            'total_ht'     => 150.00,
            'total_tva'    => 30.00,
            'total_ttc'    => 180.00,
        ]);

        $dp->lines()->create([
            'product_id'       => $this->product->id,
            'purchase_unit_id' => $this->unit->id,
            'taux_tva_id'      => $this->tauxTva->id,
            'qty'              => 1,
            'pu_ht'            => 150.00,
            'pu_ttc'           => 180.00,
            'total_ht'         => 150.00,
            'total_ttc'        => 180.00,
        ]);

        return $dp;
    }

    public function test_can_update_demande_prix_when_brouillon()
    {
        $dp = $this->createDemandePrix('brouillon');

        $updateData = [
            'tier_id'      => $this->fournisseur->id,
            'date_demande' => '2026-06-02',
            'devise_id'    => $this->devise->id,
            'branche_id'   => $this->branche->id,
            'lines'        => [
                [
                    'product_id'       => $this->product->id,
                    'purchase_unit_id' => $this->unit->id,
                    'taux_tva_id'      => $this->tauxTva->id,
                    'qty'              => 2,
                    'pu_ht'            => 150.00,
                    'pu_ttc'           => 180.00,
                    'remise'           => 0,
                    'rm'               => 0,
                ]
            ]
        ];

        $response = $this->actingAs($this->user)
            ->put(route('demandes-prix.update', $dp->id), $updateData);

        $response->assertRedirect(route('demandes-prix.index'));
        $this->assertEquals(2, $dp->fresh()->lines()->first()->qty);
    }

    public function test_cannot_update_demande_prix_when_not_brouillon()
    {
        $dp = $this->createDemandePrix('commande');

        $updateData = [
            'tier_id'      => $this->fournisseur->id,
            'date_demande' => '2026-06-02',
            'devise_id'    => $this->devise->id,
            'branche_id'   => $this->branche->id,
            'lines'        => [
                [
                    'product_id'       => $this->product->id,
                    'purchase_unit_id' => $this->unit->id,
                    'taux_tva_id'      => $this->tauxTva->id,
                    'qty'              => 2,
                    'pu_ht'            => 150.00,
                    'pu_ttc'           => 180.00,
                    'remise'           => 0,
                    'rm'               => 0,
                ]
            ]
        ];

        $response = $this->actingAs($this->user)
            ->put(route('demandes-prix.update', $dp->id), $updateData);

        $response->assertSessionHas('error');
        $this->assertEquals(1, $dp->fresh()->lines()->first()->qty);
    }

    public function test_can_delete_demande_prix_when_brouillon()
    {
        $dp = $this->createDemandePrix('brouillon');

        $response = $this->actingAs($this->user)
            ->delete(route('demandes-prix.destroy', $dp->id));

        $response->assertRedirect(route('demandes-prix.index'));
        $this->assertNull(DemandePrix::find($dp->id));
    }

    public function test_cannot_delete_demande_prix_when_not_brouillon()
    {
        $dp = $this->createDemandePrix('valide');

        $response = $this->actingAs($this->user)
            ->delete(route('demandes-prix.destroy', $dp->id));

        $response->assertSessionHas('error');
        $this->assertNotNull(DemandePrix::find($dp->id));
    }

    public function test_cannot_change_status_manually_to_commande_or_partially_commande()
    {
        $dp = $this->createDemandePrix('valide');

        $response = $this->actingAs($this->user)
            ->post(route('demandes-prix.toggle-status', $dp->id), ['status' => 'commande']);

        $response->assertSessionHas('error');
        $this->assertEquals('valide', $dp->fresh()->status);
    }

    public function test_cannot_change_status_at_all_if_already_commande_or_partially_commande()
    {
        $dp = $this->createDemandePrix('commande partiellement');

        $response = $this->actingAs($this->user)
            ->post(route('demandes-prix.toggle-status', $dp->id), ['status' => 'annulee']);

        $response->assertSessionHas('error');
        $this->assertEquals('commande partiellement', $dp->fresh()->status);
    }
}
