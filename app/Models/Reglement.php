<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Reglement extends Model
{
    use HasFactory;

    protected $table = 'reglements';

    protected $fillable = [
        'ref',
        'type',
        'tier_id',
        'date_saisie',
        'date_reglement',
        'montant_ttc',
        'mode_reglement_id',
        'statut_reglement_id',
        'compte_bancaire_id',
        'numero_transaction',
        'emetteur',
        'banque_cheque',
        'commentaire',
        'sense',
        'origin_type',
        'origin_id',
    ];

    protected $casts = [
        'date_saisie' => 'date:Y-m-d',
        'date_reglement' => 'date:Y-m-d',
        'montant_ttc' => 'double',
    ];

    public function tier(): BelongsTo
    {
        return $this->belongsTo(Tier::class, 'tier_id');
    }

    public function modeReglement(): BelongsTo
    {
        return $this->belongsTo(ModeReglement::class, 'mode_reglement_id');
    }

    public function statutReglement(): BelongsTo
    {
        return $this->belongsTo(StatutReglement::class, 'statut_reglement_id');
    }

    public function compteBancaire(): BelongsTo
    {
        return $this->belongsTo(CompteBancaire::class, 'compte_bancaire_id');
    }

    public function origin(): MorphTo
    {
        return $this->morphTo();
    }

    public function ecritureBancaire(): HasOne
    {
        return $this->hasOne(EcritureBancaire::class, 'reglement_id');
    }

    protected static function booted()
    {
        static::saved(function ($reglement) {
            // If the bank account was changed, trigger recalculation of the old bank account's balance
            if ($reglement->isDirty('compte_bancaire_id')) {
                $oldBankId = $reglement->getOriginal('compte_bancaire_id');
                if ($oldBankId) {
                    $oldBank = CompteBancaire::find($oldBankId);
                    if ($oldBank) {
                        $oldBank->recalculateSolde();
                    }
                }
            }

            if ($reglement->compte_bancaire_id) {
                // Upsert the bank writing
                EcritureBancaire::updateOrCreate(
                    ['reglement_id' => $reglement->id],
                    [
                        'compte_bancaire_id' => $reglement->compte_bancaire_id,
                        'ref' => $reglement->ref,
                        'date_operation' => $reglement->date_saisie,
                        'date_valeur' => $reglement->date_reglement,
                        'description' => $reglement->commentaire,
                        'type' => $reglement->type,
                        'origin_type' => $reglement->origin_type,
                        'origin_id' => $reglement->origin_id,
                        'numero_transaction' => $reglement->numero_transaction,
                        'amount' => $reglement->montant_ttc,
                        'sense' => $reglement->sense,
                    ]
                );
            } else {
                // If payment is not/no longer linked to a bank account, remove any bank writing
                $reglement->ecritureBancaire()->delete();
            }

            // Recalculate payment status on the origin
            if ($reglement->origin) {
                if (method_exists($reglement->origin, 'recalculatePaymentStatus')) {
                    $reglement->origin->recalculatePaymentStatus();
                }
            }
            if ($reglement->isDirty('origin_type') || $reglement->isDirty('origin_id')) {
                $oldType = $reglement->getOriginal('origin_type');
                $oldId = $reglement->getOriginal('origin_id');
                if ($oldType && $oldId && class_exists($oldType)) {
                    $oldOrigin = $oldType::find($oldId);
                    if ($oldOrigin && method_exists($oldOrigin, 'recalculatePaymentStatus')) {
                        $oldOrigin->recalculatePaymentStatus();
                    }
                }
            }
        });

        static::deleting(function ($reglement) {
            if ($reglement->compte_bancaire_id) {
                $original = $reglement->ecritureBancaire;
                if ($original) {
                    // Dissociate original and mark as cancelled
                    $original->update([
                        'reglement_id' => null,
                        'description' => '[Annulé] ' . ($original->description ?: 'Règlement ' . $reglement->ref),
                    ]);

                    // Create the contrary writing to balance the ledger
                    EcritureBancaire::create([
                        'compte_bancaire_id' => $reglement->compte_bancaire_id,
                        'ref' => $reglement->ref . '-REV',
                        'date_operation' => now()->format('Y-m-d'),
                        'date_valeur' => now()->format('Y-m-d'),
                        'description' => 'Annulation du règlement ' . $reglement->ref,
                        'type' => $reglement->type,
                        'origin_type' => $reglement->origin_type,
                        'origin_id' => $reglement->origin_id,
                        'numero_transaction' => $reglement->numero_transaction,
                        'amount' => $reglement->montant_ttc,
                        'sense' => $reglement->sense === 'd' ? 'c' : 'd',
                        'reglement_id' => null,
                    ]);
                }
            }
        });

        static::deleted(function ($reglement) {
            if ($reglement->compte_bancaire_id) {
                $compte = CompteBancaire::find($reglement->compte_bancaire_id);
                if ($compte) {
                    $compte->recalculateSolde();
                }
            }

            if ($reglement->origin) {
                if (method_exists($reglement->origin, 'recalculatePaymentStatus')) {
                    $reglement->origin->recalculatePaymentStatus();
                }
            }
        });
    }
}
