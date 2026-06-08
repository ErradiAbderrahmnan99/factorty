<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\CompteBancaire;
use App\Models\Devise;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CompteBancaireTest extends TestCase
{
    use RefreshDatabase;

    private $user;
    private $devise;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->devise = Devise::create([
            'code' => 'MAD',
            'label' => 'Dirham Marocain',
            'symbole' => 'DH',
        ]);
    }

    public function test_can_view_comptes_bancaires_index(): void
    {
        $compte = CompteBancaire::create([
            'label' => 'Compte Principal',
            'banque' => 'BCP',
            'devise_id' => $this->devise->id,
            'solde_min' => -5000,
            'status' => 'ouvert',
        ]);

        $response = $this->actingAs($this->user)
            ->get(route('comptes-bancaires.index'));

        $response->assertStatus(200);
        $response->assertSee('Compte Principal');
    }

    public function test_can_store_compte_bancaire(): void
    {
        $response = $this->actingAs($this->user)
            ->post(route('comptes-bancaires.store'), [
                'label' => 'Nouveau Compte',
                'banque' => 'Attijari',
                'rib' => '123456789012345678901234',
                'devise_id' => $this->devise->id,
                'solde_min' => -1000,
                'status' => 'ouvert',
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('comptes_bancaires', [
            'label' => 'Nouveau Compte',
            'banque' => 'Attijari',
            'devise_id' => $this->devise->id,
            'solde_min' => -1000,
            'status' => 'ouvert',
        ]);
    }

    public function test_can_update_compte_bancaire(): void
    {
        $compte = CompteBancaire::create([
            'label' => 'Compte Principal',
            'banque' => 'BCP',
            'devise_id' => $this->devise->id,
            'solde_min' => -5000,
            'status' => 'ouvert',
        ]);

        $response = $this->actingAs($this->user)
            ->patch(route('comptes-bancaires.update', $compte->id), [
                'label' => 'Compte Modifié',
                'banque' => 'BCP Modifiée',
                'rib' => '9876543210',
                'devise_id' => $this->devise->id,
                'solde_min' => -2000,
                'status' => 'ferme',
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('comptes_bancaires', [
            'id' => $compte->id,
            'label' => 'Compte Modifié',
            'banque' => 'BCP Modifiée',
            'solde_min' => -2000,
            'status' => 'ferme',
        ]);
    }

    public function test_can_view_ecritures(): void
    {
        $compte = CompteBancaire::create([
            'label' => 'Compte Principal',
            'devise_id' => $this->devise->id,
            'status' => 'ouvert',
        ]);

        $response = $this->actingAs($this->user)
            ->get(route('comptes-bancaires.ecritures', $compte->id));

        $response->assertStatus(200);
    }
}
