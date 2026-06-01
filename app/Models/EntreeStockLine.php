<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EntreeStockLine extends Model
{
    use HasFactory;

    protected $table = 'entree_stock_lines';

    protected $fillable = [
        'entree_stock_id',
        'product_id',
        'entrepot_id',
        'qty',
        'commentaire',
        'lot_number',
        'fabrication_date',
        'expiration_date',
    ];

    protected $casts = [
        'qty' => 'double',
    ];

    public function entreeStock(): BelongsTo
    {
        return $this->belongsTo(EntreeStock::class, 'entree_stock_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function entrepot(): BelongsTo
    {
        return $this->belongsTo(Entrepot::class, 'entrepot_id');
    }

    public function lots(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(EntreeStockLineLot::class, 'entree_stock_line_id');
    }
}
