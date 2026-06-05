<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StatutReglement extends Model
{
    protected $table = 'statuts_reglement';

    protected $fillable = [
        'label',
        'mode_reglement_id',
        'is_banque',
    ];

    protected $casts = [
        'is_banque' => 'boolean',
    ];

    public function modeReglement(): BelongsTo
    {
        return $this->belongsTo(ModeReglement::class, 'mode_reglement_id');
    }
}
