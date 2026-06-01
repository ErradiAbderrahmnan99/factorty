<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EntreeStock extends Model
{
    use HasFactory;

    protected $table = 'entrees_stock';

    protected $fillable = [
        'ref',
        'date_entree',
        'motif',
        'employee_id',
        'status',
    ];

    protected $casts = [
        'date_entree' => 'date:Y-m-d',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(EntreeStockLine::class, 'entree_stock_id');
    }
}
