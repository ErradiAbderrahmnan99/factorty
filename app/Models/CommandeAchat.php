<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CommandeAchat extends Model
{
    use HasFactory;

    protected $table = 'commandes_achat';

    protected $fillable = [
        'ref',
        'tier_id',
        'date_commande',
        'date_livraison',
        'devise_id',
        'mode_reglement_id',
        'condition_reglement_id',
        'compte_bancaire_id',
        'note_public',
        'note_private',
        'status',
        'total_ht',
        'total_tva',
        'total_ttc',
        'demande_prix_id',
    ];

    protected $casts = [
        'date_commande' => 'date:Y-m-d',
        'date_livraison' => 'date:Y-m-d',
        'total_ht' => 'double',
        'total_tva' => 'double',
        'total_ttc' => 'double',
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

    public function compteBancaire(): BelongsTo
    {
        return $this->belongsTo(CompteBancaire::class, 'compte_bancaire_id');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(CommandeAchatLine::class, 'commande_achat_id');
    }

    public function demandePrix(): BelongsTo
    {
        return $this->belongsTo(DemandePrix::class, 'demande_prix_id');
    }
}
