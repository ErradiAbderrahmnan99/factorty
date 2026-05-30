<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tier extends Model
{
    protected $fillable = [
        'type',
        'ref',
        'label',
        'is_professionnel',
        'description',
        'parent_id',
        'tier_category_id',
        'address',
        'country_id',
        'region_id',
        'city_id',
        'legal_form',
        'if_fiscal',
        'ice',
        'rc',
        'cnss',
        'tp',
        'rib',
        'emploi',
        'email',
        'telephone',
        'website',
        'fax',
        'linkedin',
        'twitter',
        'facebook',
        'instagram',
        'status',
    ];

    protected $casts = [
        'is_professionnel' => 'boolean',
    ];

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeProspects(Builder $query): Builder
    {
        return $query->where('type', 'prospect');
    }

    public function scopeClients(Builder $query): Builder
    {
        return $query->where('type', 'client');
    }

    public function scopeFournisseurs(Builder $query): Builder
    {
        return $query->where('type', 'fournisseur');
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Tier::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Tier::class, 'parent_id');
    }

    public function tierCategory(): BelongsTo
    {
        return $this->belongsTo(TierCategory::class);
    }

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


}
