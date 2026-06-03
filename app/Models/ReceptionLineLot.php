<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReceptionLineLot extends Model
{
    use HasFactory;

    protected $table = 'reception_line_lots';

    protected $fillable = [
        'reception_line_id',
        'lot_number',
        'quantity',
        'fabrication_date',
        'expiration_date',
    ];

    protected $casts = [
        'quantity' => 'double',
    ];

    public function receptionLine(): BelongsTo
    {
        return $this->belongsTo(ReceptionLine::class, 'reception_line_id');
    }
}
