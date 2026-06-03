<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommandeAchatLineLot extends Model
{
    use HasFactory;

    protected $table = 'commande_achat_line_lots';

    protected $fillable = [
        'commande_achat_line_id',
        'lot_number',
        'quantity',
        'fabrication_date',
        'expiration_date',
    ];

    protected $casts = [
        'quantity' => 'double',
    ];

    public function commandeAchatLine(): BelongsTo
    {
        return $this->belongsTo(CommandeAchatLine::class, 'commande_achat_line_id');
    }
}
