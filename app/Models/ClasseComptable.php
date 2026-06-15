<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ClasseComptable extends Model
{
    use HasFactory;

    protected $fillable = [
        'numero',
        'libelle',
        'nature',
    ];
}
