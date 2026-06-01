<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SortieStockLineLot extends Model
{
    use HasFactory;

    protected $table = 'sortie_stock_line_lots';

    protected $fillable = [
        'sortie_stock_line_id',
        'lot_number',
        'quantity',
    ];

    protected $casts = [
        'quantity' => 'double',
    ];

    public function sortieStockLine(): BelongsTo
    {
        return $this->belongsTo(SortieStockLine::class, 'sortie_stock_line_id');
    }
}
