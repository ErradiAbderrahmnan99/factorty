<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use App\Models\Reglement;

class FactureAchat extends Model
{
    use HasFactory;

    protected $table = 'factures_achat';

    protected $fillable = [
        'ref',
        'tier_id',
        'commercial',
        'date_facture',
        'date_echeance',
        'devise_id',
        'branche_id',
        'status',
        'total_ht',
        'total_tva',
        'total_ttc',
        'mode_reglement_id',
        'condition_reglement_id',
        'origine_id',
        'compte_bancaire_id',
        'approbateur_id',
        'delai_livraison',
        'date_livraison',
        'note_public',
        'note_private',
        'reception_id',
    ];

    protected $casts = [
        'date_facture'    => 'date:Y-m-d',
        'date_echeance'   => 'date:Y-m-d',
        'date_livraison'  => 'date:Y-m-d',
        'total_ht'        => 'double',
        'total_tva'       => 'double',
        'total_ttc'       => 'double',
        'delai_livraison' => 'integer',
        'reception_id'    => 'integer',
    ];

    public function tier(): BelongsTo
    {
        return $this->belongsTo(Tier::class, 'tier_id');
    }

    public function devise(): BelongsTo
    {
        return $this->belongsTo(Devise::class, 'devise_id');
    }

    public function modeReglement(): BelongsTo
    {
        return $this->belongsTo(ModeReglement::class, 'mode_reglement_id');
    }

    public function conditionReglement(): BelongsTo
    {
        return $this->belongsTo(ConditionReglement::class, 'condition_reglement_id');
    }

    public function origine(): BelongsTo
    {
        return $this->belongsTo(Origine::class, 'origine_id');
    }

    public function compteBancaire(): BelongsTo
    {
        return $this->belongsTo(CompteBancaire::class, 'compte_bancaire_id');
    }

    public function approbateur(): BelongsTo
    {
        return $this->belongsTo(Tier::class, 'approbateur_id');
    }

    public function branche(): BelongsTo
    {
        return $this->belongsTo(Branche::class, 'branche_id');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(FactureAchatLine::class, 'facture_achat_id');
    }

    public function reception(): BelongsTo
    {
        return $this->belongsTo(Reception::class, 'reception_id');
    }

    public function reglements(): MorphMany
    {
        return $this->morphMany(Reglement::class, 'origin');
    }

    public function recalculatePaymentStatus(): void
    {
        $totalPaid = Reglement::where('origin_type', self::class)
            ->where('origin_id', $this->id)
            ->sum('montant_ttc');

        if ($totalPaid >= $this->total_ttc) {
            $this->updateQuietly(['status' => 'payee']);
        } elseif ($totalPaid > 0) {
            $this->updateQuietly(['status' => 'payee partiellement']);
        } else {
            if (in_array($this->status, ['payee', 'payee partiellement'])) {
                $this->updateQuietly(['status' => 'validee']);
            }
        }
    }

    protected static function booted()
    {
        static::saved(function ($facture) {
            if ($facture->isDirty('total_ttc')) {
                $facture->recalculatePaymentStatus();
            }
        });
    }
}
