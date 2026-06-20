<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AvoirAchatLine extends Model
{
    use HasFactory;

    protected $table = 'avoir_achat_lines';

    protected $fillable = [
        'avoir_achat_id', 'product_id', 'purchase_unit_id',
        'taux_tva_id', 'tva', 'qty', 'pu_ht', 'pu_ttc', 'remise', 'rm', 'total_ht', 'total_ttc',
    ];

    protected $casts = [
        'tva' => 'double', 'qty' => 'double', 'pu_ht' => 'double',
        'pu_ttc' => 'double', 'remise' => 'double', 'rm' => 'double',
        'total_ht' => 'double', 'total_ttc' => 'double',
    ];

    public function avoirAchat(): BelongsTo   { return $this->belongsTo(AvoirAchat::class, 'avoir_achat_id'); }
    public function product(): BelongsTo      { return $this->belongsTo(Product::class, 'product_id'); }
    public function purchaseUnit(): BelongsTo { return $this->belongsTo(Unit::class, 'purchase_unit_id'); }
    public function tauxTva(): BelongsTo      { return $this->belongsTo(TauxTva::class, 'taux_tva_id'); }
}
