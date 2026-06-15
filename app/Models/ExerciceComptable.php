<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ExerciceComptable extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'libelle',
        'date_debut',
        'date_fin',
        'statut',
    ];

    public function periodes()
    {
        return $this->hasMany(PeriodeComptable::class, 'exercice_comptable_id');
    }
}
