<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class NatureCompteFourchette extends Model
{
    use HasFactory;

    protected $fillable = ['nature_compte_id', 'debut', 'fin'];

    public function natureCompte()
    {
        return $this->belongsTo(NatureCompte::class);
    }
}
