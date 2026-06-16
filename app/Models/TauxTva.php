<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class TauxTva extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'libelle',
        'taux',
        'compte_tva_collectee_id',
        'compte_tva_deductible_bs_id',
        'compte_tva_deductible_immo_id',
        'actif',
    ];

    protected $casts = [
        'actif' => 'boolean',
        'taux' => 'decimal:2',
    ];

    public function compteTvaCollectee()
    {
        return $this->belongsTo(PlanComptable::class, 'compte_tva_collectee_id');
    }

    public function compteTvaDeductibleBs()
    {
        return $this->belongsTo(PlanComptable::class, 'compte_tva_deductible_bs_id');
    }

    public function compteTvaDeductibleImmo()
    {
        return $this->belongsTo(PlanComptable::class, 'compte_tva_deductible_immo_id');
    }
}
