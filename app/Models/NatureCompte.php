<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class NatureCompte extends Model
{
    use HasFactory;

    protected $fillable = ['label'];

    public function fourchettes()
    {
        return $this->hasMany(NatureCompteFourchette::class);
    }
}
