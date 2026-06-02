<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContratVenteLine extends Model
{
    use HasFactory;

    protected $table = 'contrat_vente_lines';

    protected $fillable = [
        'contrat_vente_id', 'product_id', 'sale_unit_id',
        'tva', 'qty', 'pu_ht', 'pu_ttc', 'remise', 'rm', 'total_ht', 'total_ttc',
    ];

    protected $casts = [
        'tva' => 'double', 'qty' => 'double', 'pu_ht' => 'double',
        'pu_ttc' => 'double', 'remise' => 'double', 'rm' => 'double',
        'total_ht' => 'double', 'total_ttc' => 'double',
    ];

    public function contratVente(): BelongsTo { return $this->belongsTo(ContratVente::class, 'contrat_vente_id'); }
    public function product(): BelongsTo      { return $this->belongsTo(Product::class, 'product_id'); }
    public function saleUnit(): BelongsTo     { return $this->belongsTo(Unit::class, 'sale_unit_id'); }
}
