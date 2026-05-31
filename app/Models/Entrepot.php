<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Entrepot extends Model
{
    use HasFactory;

    protected $fillable = [
        'label',
        'code',
        'address',
        'parent_id',
        'assign_to',
    ];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Entrepot::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Entrepot::class, 'parent_id');
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'assign_to');
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'entrepot_product');
    }
}
