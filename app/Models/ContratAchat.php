<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ContratAchat extends Model
{
    use HasFactory;

    protected $table = 'contrats_achat';

    protected $fillable = [
        'ref', 'tier_id', 'date_contrat', 'date_echeance',
        'devise_id', 'status', 'total_ht', 'total_tva', 'total_ttc',
        'mode_reglement_id', 'condition_reglement_id',
        'compte_bancaire_id', 'note_public', 'note_private',
    ];

    protected $casts = [
        'date_contrat'  => 'date:Y-m-d',
        'date_echeance' => 'date:Y-m-d',
        'total_ht'  => 'double',
        'total_tva' => 'double',
        'total_ttc' => 'double',
    ];

    public function tier(): BelongsTo               { return $this->belongsTo(Tier::class, 'tier_id'); }
    public function devise(): BelongsTo              { return $this->belongsTo(Devise::class, 'devise_id'); }
    public function modeReglement(): BelongsTo       { return $this->belongsTo(ModeReglement::class, 'mode_reglement_id'); }
    public function conditionReglement(): BelongsTo  { return $this->belongsTo(ConditionReglement::class, 'condition_reglement_id'); }
    public function compteBancaire(): BelongsTo      { return $this->belongsTo(CompteBancaire::class, 'compte_bancaire_id'); }
    public function lines(): HasMany                 { return $this->hasMany(ContratAchatLine::class, 'contrat_achat_id'); }
}
