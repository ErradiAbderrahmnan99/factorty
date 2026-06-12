<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Entity extends Model
{
    protected $fillable = [
        'code',
        'label',
        'adress',
        'country_id',
        'region_id',
        'city_id',
        'devise_id',
        'code_postal',
        'tele',
        'email',
        'rc',
        'patente',
        'if',
        'ice',
        'cnss',
        'forme_juridique',
        'default_tva',
        'number_after_comma',
    ];

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }

    public function region(): BelongsTo
    {
        return $this->belongsTo(Region::class);
    }

    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }

    public function devise(): BelongsTo
    {
        return $this->belongsTo(Devise::class);
    }

    public function branches(): HasMany
    {
        return $this->hasMany(Branche::class);
    }
}
