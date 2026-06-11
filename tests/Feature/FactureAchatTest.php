<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Tier;
use App\Models\Product;
use App\Models\Devise;
use App\Models\Unit;
use App\Models\UnitCategory;
use App\Models\FactureAchat;
use App\Models\ModeReglement;
use App\Models\StatutReglement;
use App\Models\CompteBancaire;
use App\Models\Reglement;
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
    private $mode;
    private $statut;
    private $compte;

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

        $this->mode = ModeReglement::create(['label' => 'Espèces']);
        $this->statut = StatutReglement::create([
            'label' => 'Encaissé',
            'mode_reglement_id' => $this->mode->id,
            'is_banque' => false,
        ]);
        $this->compte = CompteBancaire::create(['label' => 'Caisse Centrale']);
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
            'status'       => 'brouillon',
            'total_ht'     => 150.00,
            'total_ttc'    => 180.00,
        ]);

        $this->markAsPaid($facture);

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

        $response->assertRedirect(route('factures-achat.index'));
        $response->assertSessionHas('error', 'Cette facture ne peut plus être modifiée.');

        $this->assertEquals('payee', $facture->fresh()->status);
    }

    public function test_can_toggle_status_to_annulee()
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
            ->post(route('factures-achat.toggle-status', $facture->id), ['status' => 'annulee']);

        $response->assertSessionHas('success');
        $this->assertEquals('annulee', $facture->fresh()->status);
    }

    public function test_cannot_change_status_after_locked()
    {
        $facture = FactureAchat::create([
            'ref'          => 'FA-202606-0004',
            'tier_id'      => $this->fournisseur->id,
            'date_facture' => '2026-06-01',
            'devise_id'    => $this->devise->id,
            'status'       => 'brouillon',
            'total_ht'     => 150.00,
            'total_ttc'    => 180.00,
        ]);

        $this->markAsPaid($facture);

        $response = $this->actingAs($this->user)
            ->post(route('factures-achat.toggle-status', $facture->id), ['status' => 'brouillon']);

        $response->assertSessionHas('error', 'Le statut d\'une facture payée ou partiellement payée ne peut pas être modifié manuellement.');
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
            'status'       => 'brouillon',
            'total_ht'     => 150.00,
            'total_ttc'    => 180.00,
        ]);

        $this->markAsPaid($facture);

        $response = $this->actingAs($this->user)
            ->from(route('factures-achat.index'))
            ->delete(route('factures-achat.destroy', $facture->id));

        $response->assertRedirect(route('factures-achat.index'));
        $response->assertSessionHas('error', 'Une facture validée, payée ou partiellement payée ne peut pas être supprimée.');
        $this->assertDatabaseHas('factures_achat', ['id' => $facture->id]);
    }

    public function test_cannot_delete_validated_facture_achat()
    {
        $facture = FactureAchat::create([
            'ref'          => 'FA-202606-0007',
            'tier_id'      => $this->fournisseur->id,
            'date_facture' => '2026-06-01',
            'devise_id'    => $this->devise->id,
            'status'       => 'validee',
            'total_ht'     => 150.00,
            'total_ttc'    => 180.00,
        ]);

        $response = $this->actingAs($this->user)
            ->from(route('factures-achat.index'))
            ->delete(route('factures-achat.destroy', $facture->id));

        $response->assertRedirect(route('factures-achat.index'));
        $response->assertSessionHas('error', 'Une facture validée, payée ou partiellement payée ne peut pas être supprimée.');
        $this->assertDatabaseHas('factures_achat', ['id' => $facture->id]);
    }

    public function test_cannot_update_validated_facture_achat()
    {
        $facture = FactureAchat::create([
            'ref'          => 'FA-202606-0008',
            'tier_id'      => $this->fournisseur->id,
            'date_facture' => '2026-06-01',
            'devise_id'    => $this->devise->id,
            'status'       => 'validee',
            'total_ht'     => 150.00,
            'total_ttc'    => 180.00,
        ]);

        $response = $this->actingAs($this->user)
            ->put(route('factures-achat.update', $facture->id), [
                'tier_id'       => $this->fournisseur->id,
                'date_facture'  => '2026-06-02',
                'devise_id'     => $this->devise->id,
                'status'        => 'validee',
                'lines'         => [],
            ]);

        $response->assertRedirect(route('factures-achat.index'));
        $response->assertSessionHas('error', 'Cette facture ne peut plus être modifiée.');
    }

    public function test_cannot_over_invoice_reception()
    {
        $reception = \App\Models\Reception::create([
            'ref' => 'BR-TEST-0001',
            'tier_id' => $this->fournisseur->id,
            'date_reception' => '2026-06-01',
            'devise_id' => $this->devise->id,
            'status' => 'valide',
            'total_ht' => 1500.00,
            'total_ttc' => 1800.00,
        ]);

        $entrepot = \App\Models\Entrepot::create([
            'code' => 'ENT-TEST',
            'label' => 'Warehouse Test',
        ]);

        $reception->lines()->create([
            'product_id' => $this->product->id,
            'entrepot_id' => $entrepot->id,
            'purchase_unit_id' => $this->unit->id,
            'tva' => 20.00,
            'qty' => 10.0,
            'pu_ht' => 150.00,
            'pu_ttc' => 180.00,
            'total_ht' => 1500.00,
            'total_ttc' => 1800.00,
        ]);

        $postData = [
            'tier_id'       => $this->fournisseur->id,
            'date_facture'  => '2026-06-01',
            'devise_id'     => $this->devise->id,
            'reception_id'  => $reception->id,
            'lines'         => [
                [
                    'product_id'       => $this->product->id,
                    'purchase_unit_id' => $this->unit->id,
                    'tva'              => 20.00,
                    'qty'              => 15.0,
                    'pu_ht'            => 150.00,
                    'pu_ttc'           => 180.00,
                ]
            ]
        ];

        $response = $this->actingAs($this->user)
            ->from(route('factures-achat.index'))
            ->post(route('factures-achat.store'), $postData);

        $response->assertSessionHasErrors(['lines.0.qty']);

        $postData['lines'][0]['qty'] = 6.0;
        $response = $this->actingAs($this->user)
            ->post(route('factures-achat.store'), $postData);

        $response->assertRedirect(route('factures-achat.index'));
        $facture1 = FactureAchat::where('reception_id', $reception->id)->first();
        $this->assertNotNull($facture1);

        $postData2 = [
            'tier_id'       => $this->fournisseur->id,
            'date_facture'  => '2026-06-01',
            'devise_id'     => $this->devise->id,
            'reception_id'  => $reception->id,
            'lines'         => [
                [
                    'product_id'       => $this->product->id,
                    'purchase_unit_id' => $this->unit->id,
                    'tva'              => 20.00,
                    'qty'              => 5.0,
                    'pu_ht'            => 150.00,
                    'pu_ttc'           => 180.00,
                ]
            ]
        ];

        $response = $this->actingAs($this->user)
            ->post(route('factures-achat.store'), $postData2);

        $response->assertSessionHasErrors(['lines.0.qty']);

        $updateData = [
            'tier_id'       => $this->fournisseur->id,
            'date_facture'  => '2026-06-01',
            'devise_id'     => $this->devise->id,
            'reception_id'  => $reception->id,
            'lines'         => [
                [
                    'product_id'       => $this->product->id,
                    'purchase_unit_id' => $this->unit->id,
                    'tva'              => 20.00,
                    'qty'              => 12.0,
                    'pu_ht'            => 150.00,
                    'pu_ttc'           => 180.00,
                ]
            ]
        ];

        $response = $this->actingAs($this->user)
            ->put(route('factures-achat.update', $facture1->id), $updateData);

        $response->assertSessionHasErrors(['lines.0.qty']);
    }

    private function markAsPaid(FactureAchat $facture): void
    {
        Reglement::create([
            'ref' => 'REG-' . uniqid(),
            'type' => 'achat',
            'tier_id' => $this->fournisseur->id,
            'date_saisie' => date('Y-m-d'),
            'date_reglement' => date('Y-m-d'),
            'montant_ttc' => $facture->total_ttc,
            'mode_reglement_id' => $this->mode->id,
            'statut_reglement_id' => $this->statut->id,
            'compte_bancaire_id' => $this->compte->id,
            'sense' => 'c',
            'origin_type' => FactureAchat::class,
            'origin_id' => $facture->id,
        ]);
    }
}
