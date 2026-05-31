<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommandeLineLot extends Model
{
    use HasFactory;

    protected $table = 'commande_line_lots';

    protected $fillable = [
        'commande_line_id',
        'lot_number',
        'quantity',
        'fabrication_date',
        'expiration_date',
    ];

    protected $casts = [
        'quantity' => 'double',
    ];

    public function commandeLine(): BelongsTo
    {
        return $this->belongsTo(CommandeLine::class, 'commande_line_id');
    }
}
