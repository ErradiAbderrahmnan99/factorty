<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PeriodeComptable extends Model
{
    use HasFactory;

    protected $fillable = [
        'exercice_comptable_id',
        'code',
        'libelle',
        'date_debut',
        'date_fin',
        'statut',
    ];

    public function exercice()
    {
        return $this->belongsTo(ExerciceComptable::class, 'exercice_comptable_id');
    }
}
