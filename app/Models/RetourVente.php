<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RetourVente extends Model
{
    use HasFactory;

    protected $table = 'retours_vente';

    protected $fillable = [
        'ref',
        'tier_id',
        'commercial',
        'date_retour',
        'devise_id',
        'status',
        'total_ht',
        'total_tva',
        'total_ttc',
    ];

    protected $casts = [
        'date_retour' => 'date:Y-m-d',
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

    public function lines(): HasMany
    {
        return $this->hasMany(RetourVenteLine::class, 'retour_vente_id');
    }
}
