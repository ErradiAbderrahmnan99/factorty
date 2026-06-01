<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SortieStockLine extends Model
{
    use HasFactory;

    protected $table = 'sortie_stock_lines';

    protected $fillable = [
        'sortie_stock_id',
        'product_id',
        'entrepot_id',
        'qty',
        'commentaire',
        'lot_number',
    ];

    protected $casts = [
        'qty' => 'double',
    ];

    public function sortieStock(): BelongsTo
    {
        return $this->belongsTo(SortieStock::class, 'sortie_stock_id');
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
        return $this->hasMany(SortieStockLineLot::class, 'sortie_stock_line_id');
    }
}
