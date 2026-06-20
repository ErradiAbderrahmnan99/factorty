<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DevisLine extends Model
{
    use HasFactory;

    protected $fillable = [
        'devis_id',
        'product_id',
        'sale_unit_id',
        'taux_tva_id',
        'tva',
        'qty',
        'qty_commande',
        'pu_ht',
        'pu_ttc',
        'remise',
        'rm',
        'total_ht',
        'total_ttc',
    ];

    protected $casts = [
        'tva' => 'double',
        'qty' => 'double',
        'qty_commande' => 'double',
        'pu_ht' => 'double',
        'pu_ttc' => 'double',
        'remise' => 'double',
        'rm' => 'double',
        'total_ht' => 'double',
        'total_ttc' => 'double',
    ];

    public function devis(): BelongsTo
    {
        return $this->belongsTo(Devis::class, 'devis_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function saleUnit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'sale_unit_id');
    }

    public function tauxTva(): BelongsTo
    {
        return $this->belongsTo(TauxTva::class, 'taux_tva_id');
    }
}
