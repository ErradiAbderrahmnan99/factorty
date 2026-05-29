<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Unit extends Model
{
    use HasFactory;

    protected $fillable = [
        'unit_category_id',
        'code',
        'label',
        'ratio',
    ];

    protected $casts = [
        'ratio' => 'double',
    ];

    public function unitCategory(): BelongsTo
    {
        return $this->belongsTo(UnitCategory::class, 'unit_category_id');
    }
}
