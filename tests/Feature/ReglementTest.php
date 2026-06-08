<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Tier;
use App\Models\ModeReglement;
use App\Models\StatutReglement;
use App\Models\CompteBancaire;
use App\Models\Reglement;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReglementTest extends TestCase
{
    use RefreshDatabase;

    private $user;
    private $client;
    private $mode;
    private $statut;
    private $compte;

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

        $this->mode = ModeReglement::create(['label' => 'Espèces']);
        
        $this->statut = StatutReglement::create([
            'label' => 'Encaissé',
            'mode_reglement_id' => $this->mode->id,
            'is_banque' => false,
        ]);

        $this->compte = CompteBancaire::create(['label' => 'Caisse Centrale']);
    }

    public function test_cannot_create_reglement_with_mismatched_sense(): void
    {
        $response = $this->actingAs($this->user)
            ->post(route('reglements.store'), [
                'type' => 'vente',
                'tier_id' => $this->client->id,
                'date_saisie' => date('Y-m-d'),
                'date_reglement' => date('Y-m-d'),
                'montant_ttc' => 1500,
                'mode_reglement_id' => $this->mode->id,
                'statut_reglement_id' => $this->statut->id,
                'compte_bancaire_id' => $this->compte->id,
                'sense' => 'c', // Mismatched (vente must be 'd')
            ]);

        $response->assertSessionHasErrors(['sense']);
    }

    public function test_can_create_reglement_with_correct_sense(): void
    {
        $response = $this->actingAs($this->user)
            ->post(route('reglements.store'), [
                'type' => 'vente',
                'tier_id' => $this->client->id,
                'date_saisie' => date('Y-m-d'),
                'date_reglement' => date('Y-m-d'),
                'montant_ttc' => 1500,
                'mode_reglement_id' => $this->mode->id,
                'statut_reglement_id' => $this->statut->id,
                'compte_bancaire_id' => $this->compte->id,
                'sense' => 'd', // Correct (vente must be 'd')
            ]);

        $response->assertRedirect(route('reglements.index'));
        $this->assertDatabaseHas('reglements', [
            'type' => 'vente',
            'sense' => 'd',
            'montant_ttc' => 1500,
        ]);
    }

    public function test_reglement_creates_cloned_ecriture_bancaire_and_updates_balance(): void
    {
        // 1. Create a Reglement (vente = debit = +1500)
        $reglement = Reglement::create([
            'ref' => 'REG-T001',
            'type' => 'vente',
            'tier_id' => $this->client->id,
            'date_saisie' => '2026-06-08',
            'date_reglement' => '2026-06-08',
            'montant_ttc' => 1500,
            'mode_reglement_id' => $this->mode->id,
            'statut_reglement_id' => $this->statut->id,
            'compte_bancaire_id' => $this->compte->id,
            'sense' => 'd',
        ]);

        // Verify EcritureBancaire is created
        $this->assertDatabaseHas('ecritures_bancaires', [
            'reglement_id' => $reglement->id,
            'compte_bancaire_id' => $this->compte->id,
            'ref' => 'REG-T001',
            'amount' => 1500,
            'sense' => 'd',
            'type' => 'vente',
        ]);

        // Verify CompteBancaire balance is updated
        $this->compte->refresh();
        $this->assertEquals(1500, $this->compte->solde);

        // 2. Update Reglement (amount to 2000)
        $reglement->update([
            'montant_ttc' => 2000,
        ]);

        $this->assertDatabaseHas('ecritures_bancaires', [
            'reglement_id' => $reglement->id,
            'amount' => 2000,
        ]);

        $this->compte->refresh();
        $this->assertEquals(2000, $this->compte->solde);

        // 3. Move Reglement to a new CompteBancaire (Compte 2)
        $compte2 = CompteBancaire::create(['label' => 'Compte Courant']);
        $reglement->update([
            'compte_bancaire_id' => $compte2->id,
        ]);

        // Old bank balance should be 0
        $this->compte->refresh();
        $this->assertEquals(0, $this->compte->solde);

        // New bank balance should be 2000
        $compte2->refresh();
        $this->assertEquals(2000, $compte2->solde);

        // Verify EcritureBancaire points to the new account
        $this->assertDatabaseHas('ecritures_bancaires', [
            'reglement_id' => $reglement->id,
            'compte_bancaire_id' => $compte2->id,
            'amount' => 2000,
        ]);

        // 4. Delete Reglement
        $reglement->delete();

        // New bank balance should go back to 0
        $compte2->refresh();
        $this->assertEquals(0, $compte2->solde);

        // EcritureBancaire should be deleted
        $this->assertDatabaseMissing('ecritures_bancaires', [
            'reglement_id' => $reglement->id,
        ]);
    }
}
