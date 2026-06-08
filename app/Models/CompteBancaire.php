<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CompteBancaire extends Model
{
    protected $table = 'comptes_bancaires';

    protected $fillable = [
        'label',
        'banque',
        'rib',
        'iban',
        'swift',
        'devise_id',
        'solde_min',
        'solde',
        'status',
    ];

    protected $casts = [
        'solde_min' => 'double',
        'solde' => 'double',
    ];

    public function devise(): BelongsTo
    {
        return $this->belongsTo(Devise::class, 'devise_id');
    }

    public function ecritures(): HasMany
    {
        return $this->hasMany(EcritureBancaire::class, 'compte_bancaire_id');
    }

    /**
     * Recalculates the account balance based on all debit (+) and credit (-) writings.
     */
    public function recalculateSolde(): void
    {
        $debits = $this->ecritures()->where('sense', 'd')->sum('amount');
        $credits = $this->ecritures()->where('sense', 'c')->sum('amount');
        
        $this->updateQuietly([
            'solde' => $debits - $credits
        ]);
    }
}
