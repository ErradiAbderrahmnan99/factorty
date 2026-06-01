<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class TypeApporteur extends Model {
    protected $table = 'types_apporteur';
    protected $fillable = ['label'];
}
