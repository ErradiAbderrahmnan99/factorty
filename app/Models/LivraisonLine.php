<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LivraisonLine extends Model
{
    use HasFactory;

    protected $table = 'livraison_lines';

    protected $fillable = [
        'livraison_id',
        'commande_line_id',
        'product_id',
        'entrepot_id',
        'sale_unit_id',
        'taux_tva_id',
        'tva',
        'qty',
        'pu_ht',
        'pu_ttc',
        'remise',
        'rm',
        'total_ht',
        'total_ttc',
    ];

    protected $casts = [
        'commande_line_id' => 'integer',
        'tva' => 'double',
        'qty' => 'double',
        'pu_ht' => 'double',
        'pu_ttc' => 'double',
        'remise' => 'double',
        'rm' => 'double',
        'total_ht' => 'double',
        'total_ttc' => 'double',
    ];

    public function livraison(): BelongsTo
    {
        return $this->belongsTo(Livraison::class, 'livraison_id');
    }

    public function commandeLine(): BelongsTo
    {
        return $this->belongsTo(CommandeLine::class, 'commande_line_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function entrepot(): BelongsTo
    {
        return $this->belongsTo(Entrepot::class, 'entrepot_id');
    }

    public function saleUnit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'sale_unit_id');
    }

    public function tauxTva(): BelongsTo
    {
        return $this->belongsTo(TauxTva::class, 'taux_tva_id');
    }

    public function lots(): HasMany
    {
        return $this->hasMany(LivraisonLineLot::class, 'livraison_line_id');
    }
}
