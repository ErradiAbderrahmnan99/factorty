<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PieceComptable extends Model
{
    protected $table = 'pieces_comptables';

    protected $fillable = [
        'journal_comptable_id',
        'exercice_comptable_id',
        'periode_comptable_id',
        'jour',
        'numero_piece',
        'numero_facture',
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

    public function lignes()
    {
        return $this->hasMany(EcritureComptable::class, 'piece_comptable_id');
    }
}
