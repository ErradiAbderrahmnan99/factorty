<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LivraisonLineLot extends Model
{
    use HasFactory;

    protected $table = 'livraison_line_lots';

    protected $fillable = [
        'livraison_line_id',
        'lot_number',
        'quantity',
        'fabrication_date',
        'expiration_date',
    ];

    protected $casts = [
        'quantity' => 'double',
    ];

    public function livraisonLine(): BelongsTo
    {
        return $this->belongsTo(LivraisonLine::class, 'livraison_line_id');
    }
}
