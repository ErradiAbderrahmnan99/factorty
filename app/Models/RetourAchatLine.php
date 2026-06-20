<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RetourAchatLine extends Model
{
    use HasFactory;

    protected $table = 'retour_achat_lines';

    protected $fillable = [
        'retour_achat_id',
        'reception_line_id',
        'product_id',
        'entrepot_id',
        'purchase_unit_id',
        'taux_tva_id',
        'tva',
        'qty',
        'pu_ht',
        'pu_ttc',
        'remise',
        'rm',
        'total_ht',
        'total_ttc',
    ];

    protected $casts = [
        'tva' => 'double',
        'qty' => 'double',
        'pu_ht' => 'double',
        'pu_ttc' => 'double',
        'remise' => 'double',
        'rm' => 'double',
        'total_ht' => 'double',
        'total_ttc' => 'double',
    ];

    public function retourAchat(): BelongsTo
    {
        return $this->belongsTo(RetourAchat::class, 'retour_achat_id');
    }

    public function receptionLine(): BelongsTo
    {
        return $this->belongsTo(ReceptionLine::class, 'reception_line_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function entrepot(): BelongsTo
    {
        return $this->belongsTo(Entrepot::class, 'entrepot_id');
    }

    public function purchaseUnit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'purchase_unit_id');
    }

    public function tauxTva(): BelongsTo
    {
        return $this->belongsTo(TauxTva::class, 'taux_tva_id');
    }

    public function lots(): HasMany
    {
        return $this->hasMany(RetourAchatLineLot::class, 'retour_achat_line_id');
    }
}
