<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UnitCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'label',
        'description',
    ];

    public function units(): HasMany
    {
        return $this->hasMany(Unit::class);
    }
}
