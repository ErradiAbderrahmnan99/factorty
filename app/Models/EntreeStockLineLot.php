<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EntreeStockLineLot extends Model
{
    use HasFactory;

    protected $table = 'entree_stock_line_lots';

    protected $fillable = [
        'entree_stock_line_id',
        'lot_number',
        'quantity',
        'fabrication_date',
        'expiration_date',
    ];

    protected $casts = [
        'quantity' => 'double',
    ];

    public function entreeStockLine(): BelongsTo
    {
        return $this->belongsTo(EntreeStockLine::class, 'entree_stock_line_id');
    }
}
