<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductLot extends Model
{
    use HasFactory;

    protected $table = 'entrepot_product_lots';

    protected $fillable = [
        'entrepot_product_id',
        'lot_number',
        'quantity',
        'fabrication_date',
        'expiration_date',
    ];

    protected $casts = [
        'quantity' => 'double',
        'fabrication_date' => 'date:Y-m-d',
        'expiration_date' => 'date:Y-m-d',
    ];

    public function productEntrepot(): BelongsTo
    {
        return $this->belongsTo(ProductEntrepot::class, 'entrepot_product_id');
    }
}
