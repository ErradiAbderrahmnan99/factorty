<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DemandePrixLine extends Model
{
    use HasFactory;

    protected $table = 'demande_prix_lines';

    protected $fillable = [
        'demande_prix_id', 'product_id', 'purchase_unit_id',
        'tva', 'qty', 'pu_ht', 'pu_ttc', 'remise', 'rm', 'total_ht', 'total_ttc',
    ];

    protected $casts = [
        'tva' => 'double', 'qty' => 'double', 'pu_ht' => 'double',
        'pu_ttc' => 'double', 'remise' => 'double', 'rm' => 'double',
        'total_ht' => 'double', 'total_ttc' => 'double',
    ];

    public function demandePrix(): BelongsTo { return $this->belongsTo(DemandePrix::class, 'demande_prix_id'); }
    public function product(): BelongsTo     { return $this->belongsTo(Product::class, 'product_id'); }
    public function purchaseUnit(): BelongsTo  { return $this->belongsTo(Unit::class, 'purchase_unit_id'); }
}
