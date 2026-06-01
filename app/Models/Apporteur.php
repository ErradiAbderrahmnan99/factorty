<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class Apporteur extends Model {
    protected $table = 'apporteurs';
    protected $fillable = ['label', 'type_apporteur_id', 'telephone', 'email'];
    public function typeApporteur(): BelongsTo { return $this->belongsTo(TypeApporteur::class, 'type_apporteur_id'); }
}
