<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class ConditionReglement extends Model {
    protected $table = 'conditions_reglement';
    protected $fillable = ['label', 'nb_jours'];
    protected $casts = ['nb_jours' => 'integer'];
}
