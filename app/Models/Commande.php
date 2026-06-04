<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Commande extends Model
{
    use HasFactory;

    protected $table = 'commandes';

    protected $fillable = [
        'ref',
        'tier_id',
        'commercial',
        'date_commande',
        'devise_id',
        'devis_id',
        'status',
        'total_ht',
        'total_tva',
        'total_ttc',
    ];

    protected $casts = [
        'date_commande' => 'date:Y-m-d',
        'devis_id' => 'integer',
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

    public function devis(): BelongsTo
    {
        return $this->belongsTo(Devis::class, 'devis_id');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(CommandeLine::class, 'commande_id');
    }

    public function livraisons(): HasMany
    {
        return $this->hasMany(Livraison::class, 'commande_id');
    }
}
