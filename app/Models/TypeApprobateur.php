<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TypeApprobateur extends Model
{
    protected $table = 'types_approbateur';

    protected $fillable = [
        'label',
    ];

    public function tiers(): HasMany
    {
        return $this->hasMany(Tier::class, 'type_approbateur_id');
    }
}
