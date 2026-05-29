<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Entity extends Model
{
    protected $fillable = [
        'code',
        'label',
        'adress',
        'country',
        'city',
        'code_postal',
        'tele',
        'email',
        'currency',
        'tva',
        'rc',
        'patente',
        'if',
        'ice',
        'cnss',
        'forme_juridique',
    ];
}
