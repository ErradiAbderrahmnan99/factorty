<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommandeAchatLine extends Model
{
    use HasFactory;

    protected $table = 'commande_achat_lines';

    protected $fillable = [
        'commande_achat_id',
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
        'demande_prix_line_id',
        'qty_receptionnee',
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
        'qty_receptionnee' => 'double',
    ];

    public function commandeAchat(): BelongsTo
    {
        return $this->belongsTo(CommandeAchat::class, 'commande_achat_id');
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

    public function lots(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(CommandeAchatLineLot::class, 'commande_achat_line_id');
    }

    public function demandePrixLine(): BelongsTo
    {
        return $this->belongsTo(DemandePrixLine::class, 'demande_prix_line_id');
    }

    public function tauxTva(): BelongsTo
    {
        return $this->belongsTo(TauxTva::class, 'taux_tva_id');
    }
}
