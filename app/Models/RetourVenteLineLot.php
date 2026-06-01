<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RetourVenteLineLot extends Model
{
    use HasFactory;

    protected $table = 'retour_vente_line_lots';

    protected $fillable = [
        'retour_vente_line_id',
        'lot_number',
        'quantity',
        'fabrication_date',
        'expiration_date',
    ];

    protected $casts = [
        'quantity' => 'double',
    ];

    public function retourVenteLine(): BelongsTo
    {
        return $this->belongsTo(RetourVenteLine::class, 'retour_vente_line_id');
    }
}
