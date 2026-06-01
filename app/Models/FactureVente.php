<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FactureVente extends Model
{
    use HasFactory;

    protected $table = 'factures_vente';

    protected $fillable = [
        'ref', 'tier_id', 'commercial', 'date_facture', 'date_echeance',
        'devise_id', 'status', 'total_ht', 'total_tva', 'total_ttc',
        'mode_reglement_id', 'condition_reglement_id', 'origine_id',
        'compte_bancaire_id', 'type_apporteur_id', 'apporteur_id',
        'delai_livraison', 'date_livraison', 'note_public', 'note_private',
    ];

    protected $casts = [
        'date_facture'  => 'date:Y-m-d',
        'date_echeance' => 'date:Y-m-d',
        'date_livraison' => 'date:Y-m-d',
        'total_ht'  => 'double',
        'total_tva' => 'double',
        'total_ttc' => 'double',
        'delai_livraison' => 'integer',
    ];

    public function tier(): BelongsTo               { return $this->belongsTo(Tier::class, 'tier_id'); }
    public function devise(): BelongsTo              { return $this->belongsTo(Devise::class, 'devise_id'); }
    public function modeReglement(): BelongsTo       { return $this->belongsTo(ModeReglement::class, 'mode_reglement_id'); }
    public function conditionReglement(): BelongsTo  { return $this->belongsTo(ConditionReglement::class, 'condition_reglement_id'); }
    public function origine(): BelongsTo             { return $this->belongsTo(Origine::class, 'origine_id'); }
    public function compteBancaire(): BelongsTo      { return $this->belongsTo(CompteBancaire::class, 'compte_bancaire_id'); }
    public function typeApporteur(): BelongsTo       { return $this->belongsTo(TypeApporteur::class, 'type_apporteur_id'); }
    public function apporteur(): BelongsTo           { return $this->belongsTo(Apporteur::class, 'apporteur_id'); }
    public function lines(): HasMany                 { return $this->hasMany(FactureVenteLine::class, 'facture_vente_id'); }
}
