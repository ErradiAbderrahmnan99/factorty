<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Tier;
use App\Models\Product;
use App\Models\Devise;
use App\Models\Unit;
use App\Models\UnitCategory;
use App\Models\CommandeAchat;
use App\Models\TauxTva;
use App\Models\Branche;
use App\Models\Entrepot;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommandeAchatTest extends TestCase
{
    use RefreshDatabase;

    private $user;
    private $fournisseur;
    private $devise;
    private $unit;
    private $product;
    private $tauxTva;
    private $branche;
    private $entrepot;

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

        $this->entrepot = Entrepot::create([
            'code'  => 'ENT-TEST',
            'label' => 'Entrepot Test',
        ]);
    }

    private function createCommandeAchat($status = 'brouillon')
    {
        $ca = CommandeAchat::create([
            'ref'            => 'CCA-202606-' . rand(1000, 9999) . '-' . $status,
            'tier_id'        => $this->fournisseur->id,
            'date_commande'  => '2026-06-01',
            'devise_id'      => $this->devise->id,
            'branche_id'     => $this->branche->id,
            'status'         => $status,
            'total_ht'       => 150.00,
            'total_tva'      => 30.00,
            'total_ttc'      => 180.00,
        ]);

        $ca->lines()->create([
            'product_id'       => $this->product->id,
            'entrepot_id'      => $this->entrepot->id,
            'purchase_unit_id' => $this->unit->id,
            'taux_tva_id'      => $this->tauxTva->id,
            'qty'              => 1,
            'pu_ht'            => 150.00,
            'pu_ttc'           => 180.00,
            'total_ht'         => 150.00,
            'total_ttc'        => 180.00,
        ]);

        return $ca;
    }

    public function test_can_update_commande_achat_when_brouillon()
    {
        $ca = $this->createCommandeAchat('brouillon');

        $updateData = [
            'tier_id'        => $this->fournisseur->id,
            'date_commande'  => '2026-06-02',
            'devise_id'      => $this->devise->id,
            'branche_id'     => $this->branche->id,
            'lines'          => [
                [
                    'product_id'       => $this->product->id,
                    'entrepot_id'      => $this->entrepot->id,
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
            ->put(route('commandes-achat.update', $ca->id), $updateData);

        $response->assertRedirect(route('commandes-achat.index'));
        $this->assertEquals(2, $ca->fresh()->lines()->first()->qty);
    }

    public function test_cannot_update_commande_achat_when_locked()
    {
        foreach (['commandee', 'recue', 'recue partiellement'] as $status) {
            $ca = $this->createCommandeAchat($status);

            $updateData = [
                'tier_id'        => $this->fournisseur->id,
                'date_commande'  => '2026-06-02',
                'devise_id'      => $this->devise->id,
                'branche_id'     => $this->branche->id,
                'lines'          => [
                    [
                        'product_id'       => $this->product->id,
                        'entrepot_id'      => $this->entrepot->id,
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
                ->put(route('commandes-achat.update', $ca->id), $updateData);

            $response->assertSessionHas('error');
            $this->assertEquals(1, $ca->fresh()->lines()->first()->qty);
        }
    }

    public function test_can_delete_commande_achat_when_brouillon()
    {
        $ca = $this->createCommandeAchat('brouillon');

        $response = $this->actingAs($this->user)
            ->delete(route('commandes-achat.destroy', $ca->id));

        $response->assertRedirect(route('commandes-achat.index'));
        $this->assertNull(CommandeAchat::find($ca->id));
    }

    public function test_cannot_delete_commande_achat_when_locked()
    {
        foreach (['commandee', 'recue', 'recue partiellement'] as $status) {
            $ca = $this->createCommandeAchat($status);

            $response = $this->actingAs($this->user)
                ->delete(route('commandes-achat.destroy', $ca->id));

            $response->assertSessionHas('error');
            $this->assertNotNull(CommandeAchat::find($ca->id));
        }
    }

    public function test_cannot_change_status_manually_to_received_states()
    {
        $ca = $this->createCommandeAchat('brouillon');

        foreach (['recue', 'recue partiellement'] as $lockedStatus) {
            $response = $this->actingAs($this->user)
                ->post(route('commandes-achat.toggle-status', $ca->id), ['status' => $lockedStatus]);

            $response->assertSessionHas('error');
            $this->assertEquals('brouillon', $ca->fresh()->status);
        }
    }

    public function test_cannot_change_status_at_all_if_already_locked()
    {
        foreach (['commandee', 'recue', 'recue partiellement'] as $status) {
            $ca = $this->createCommandeAchat($status);

            $response = $this->actingAs($this->user)
                ->post(route('commandes-achat.toggle-status', $ca->id), ['status' => 'annulee']);

            $response->assertSessionHas('error');
            $this->assertEquals($status, $ca->fresh()->status);
        }
    }
}
