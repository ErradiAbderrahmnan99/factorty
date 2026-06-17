<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EcritureComptable extends Model
{
    protected $fillable = [
        'journal_comptable_id',
        'exercice_comptable_id',
        'periode_comptable_id',
        'jour',
        'numero_piece',
        'numero_facture',
        'plan_comptable_id',
        'compte_tier_id',
        'libelle',
        'date_echeance',
        'debit',
        'credit',
    ];

    protected $casts = [
        'date_echeance' => 'date',
        'debit' => 'decimal:2',
        'credit' => 'decimal:2',
    ];

    public function journal()
    {
        return $this->belongsTo(JournalComptable::class, 'journal_comptable_id');
    }

    public function exercice()
    {
        return $this->belongsTo(ExerciceComptable::class, 'exercice_comptable_id');
    }

    public function periode()
    {
        return $this->belongsTo(PeriodeComptable::class, 'periode_comptable_id');
    }

    public function planComptable()
    {
        return $this->belongsTo(PlanComptable::class, 'plan_comptable_id');
    }

    public function compteTier()
    {
        return $this->belongsTo(PlanComptable::class, 'compte_tier_id');
    }
}
