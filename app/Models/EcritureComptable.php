<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EcritureComptable extends Model
{
    protected $table = 'ecriture_comptables';

    protected $fillable = [
        'piece_comptable_id',
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

    public function piece()
    {
        return $this->belongsTo(PieceComptable::class, 'piece_comptable_id');
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
