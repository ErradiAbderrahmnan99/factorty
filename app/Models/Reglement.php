<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
}
