<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TierCategory extends Model
{
    protected $fillable = ['code', 'label', 'description'];

    public function tiers(): HasMany
    {
        return $this->hasMany(Tier::class);
    }
}
