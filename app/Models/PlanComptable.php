<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class PlanComptable extends Model
{
    use HasFactory;

    protected $fillable = [
        'numero',
        'libelle',
        'classe_id',
        'parent_id',
        'sens',
        'collectif',
        'tier_id',
        'actif',
    ];

    protected $casts = [
        'collectif' => 'boolean',
        'actif' => 'boolean',
    ];

    public function classe()
    {
        return $this->belongsTo(ClasseComptable::class, 'classe_id');
    }

    public function parent()
    {
        return $this->belongsTo(PlanComptable::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(PlanComptable::class, 'parent_id');
    }

    public function tier()
    {
        return $this->belongsTo(Tier::class, 'tier_id'); // Assuming the model is Tier
    }
}
