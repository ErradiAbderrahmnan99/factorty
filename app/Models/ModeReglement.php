<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class ModeReglement extends Model {
    protected $table = 'modes_reglement';
    protected $fillable = ['label'];

    public function statuts()
    {
        return $this->hasMany(StatutReglement::class, 'mode_reglement_id');
    }
}
