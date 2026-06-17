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
        'nature_compte_id',
        'compte_contrepartie_id',
    ];

    public function compteContrepartie()
    {
        return $this->belongsTo(PlanComptable::class, 'compte_contrepartie_id');
    }

    public function natureCompte()
    {
        return $this->belongsTo(NatureCompte::class, 'nature_compte_id');
    }
}
