<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AvoirVente extends Model
{
    use HasFactory;

    protected $table = 'avoirs_vente';

    protected $fillable = [
        'ref', 'tier_id', 'facture_vente_id', 'commercial', 'date_avoir',
        'devise_id', 'status', 'total_ht', 'total_tva', 'total_ttc',
        'mode_reglement_id', 'condition_reglement_id', 'origine_id',
        'compte_bancaire_id', 'approbateur_id',
        'note_public', 'note_private',
    ];

    protected $casts = [
        'date_avoir' => 'date:Y-m-d',
        'total_ht'  => 'double',
        'total_tva' => 'double',
        'total_ttc' => 'double',
    ];

    public function tier(): BelongsTo               { return $this->belongsTo(Tier::class, 'tier_id'); }
    public function factureVente(): BelongsTo       { return $this->belongsTo(FactureVente::class, 'facture_vente_id'); }
    public function devise(): BelongsTo              { return $this->belongsTo(Devise::class, 'devise_id'); }
    public function modeReglement(): BelongsTo       { return $this->belongsTo(ModeReglement::class, 'mode_reglement_id'); }
    public function conditionReglement(): BelongsTo  { return $this->belongsTo(ConditionReglement::class, 'condition_reglement_id'); }
    public function origine(): BelongsTo             { return $this->belongsTo(Origine::class, 'origine_id'); }
    public function compteBancaire(): BelongsTo      { return $this->belongsTo(CompteBancaire::class, 'compte_bancaire_id'); }
    public function approbateur(): BelongsTo         { return $this->belongsTo(Tier::class, 'approbateur_id'); }
    public function lines(): HasMany                 { return $this->hasMany(AvoirVenteLine::class, 'avoir_vente_id'); }
}
