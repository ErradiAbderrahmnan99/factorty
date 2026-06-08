<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class EcritureBancaire extends Model
{
    use HasFactory;

    protected $table = 'ecritures_bancaires';

    protected $fillable = [
        'compte_bancaire_id',
        'ref',
        'date_operation',
        'date_valeur',
        'description',
        'reglement_id',
        'type',
        'origin_type',
        'origin_id',
        'numero_transaction',
        'amount',
        'sense',
    ];

    protected $casts = [
        'date_operation' => 'date:Y-m-d',
        'date_valeur' => 'date:Y-m-d',
        'amount' => 'double',
    ];

    public function compteBancaire(): BelongsTo
    {
        return $this->belongsTo(CompteBancaire::class, 'compte_bancaire_id');
    }

    public function reglement(): BelongsTo
    {
        return $this->belongsTo(Reglement::class, 'reglement_id');
    }

    public function origin(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Boot the model to handle automatic recalculation of CompteBancaire balance.
     */
    protected static function boot()
    {
        parent::boot();

        static::saved(function ($ecriture) {
            if ($ecriture->compteBancaire) {
                $ecriture->compteBancaire->recalculateSolde();
            }
            // If the bank account was changed, also recalculate the old bank account
            if ($ecriture->isDirty('compte_bancaire_id')) {
                $oldBankId = $ecriture->getOriginal('compte_bancaire_id');
                if ($oldBankId) {
                    $oldBank = CompteBancaire::find($oldBankId);
                    if ($oldBank) {
                        $oldBank->recalculateSolde();
                    }
                }
            }
        });

        static::deleted(function ($ecriture) {
            if ($ecriture->compteBancaire) {
                $ecriture->compteBancaire->recalculateSolde();
            }
        });
    }
}
