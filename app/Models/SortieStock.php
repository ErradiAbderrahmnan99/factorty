<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SortieStock extends Model
{
    use HasFactory;

    protected $table = 'sorties_stock';

    protected $fillable = [
        'ref',
        'date_sortie',
        'motif',
        'employee_id',
        'status',
    ];

    protected $casts = [
        'date_sortie' => 'date:Y-m-d',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(SortieStockLine::class, 'sortie_stock_id');
    }
}
