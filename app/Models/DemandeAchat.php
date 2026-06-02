<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DemandeAchat extends Model
{
    use HasFactory;

    protected $table = 'demandes_achat';

    protected $fillable = [
        'ref', 'date_demande', 'urgence', 'employee_id', 'tier_id',
        'devise_id', 'mode_reglement_id', 'condition_reglement_id', 'compte_bancaire_id',
        'status', 'total_ht', 'total_tva', 'total_ttc',
        'note_public', 'note_private',
    ];

    protected $casts = [
        'date_demande' => 'date:Y-m-d',
        'total_ht'  => 'double',
        'total_tva' => 'double',
        'total_ttc' => 'double',
    ];

    public function employee(): BelongsTo           { return $this->belongsTo(Employee::class, 'employee_id'); }
    public function tier(): BelongsTo               { return $this->belongsTo(Tier::class, 'tier_id'); }
    public function devise(): BelongsTo              { return $this->belongsTo(Devise::class, 'devise_id'); }
    public function modeReglement(): BelongsTo      { return $this->belongsTo(ModeReglement::class, 'mode_reglement_id'); }
    public function conditionReglement(): BelongsTo { return $this->belongsTo(ConditionReglement::class, 'condition_reglement_id'); }
    public function compteBancaire(): BelongsTo     { return $this->belongsTo(CompteBancaire::class, 'compte_bancaire_id'); }
    public function lines(): HasMany                 { return $this->hasMany(DemandeAchatLine::class, 'demande_achat_id'); }
}
