<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class JournalComptable extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'libelle',
        'type',
        'compte_contrepartie_id',
    ];

    public function compteContrepartie()
    {
        return $this->belongsTo(PlanComptable::class, 'compte_contrepartie_id');
    }
}
