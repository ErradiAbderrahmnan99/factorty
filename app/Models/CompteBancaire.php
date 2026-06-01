<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class CompteBancaire extends Model {
    protected $table = 'comptes_bancaires';
    protected $fillable = ['label', 'banque', 'rib', 'iban', 'swift'];
}
