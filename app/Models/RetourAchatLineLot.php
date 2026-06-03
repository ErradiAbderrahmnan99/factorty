<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RetourAchatLineLot extends Model
{
    use HasFactory;

    protected $table = 'retour_achat_line_lots';

    protected $fillable = [
        'retour_achat_line_id',
        'lot_number',
        'quantity',
        'fabrication_date',
        'expiration_date',
    ];

    protected $casts = [
        'quantity' => 'double',
    ];

    public function retourAchatLine(): BelongsTo
    {
        return $this->belongsTo(RetourAchatLine::class, 'retour_achat_line_id');
    }
}
