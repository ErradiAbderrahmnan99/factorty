<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RetourVenteLine extends Model
{
    use HasFactory;

    protected $table = 'retour_vente_lines';

    protected $fillable = [
        'retour_vente_id',
        'livraison_line_id',
        'product_id',
        'entrepot_id',
        'sale_unit_id',
        'taux_tva_id',
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

    public function retourVente(): BelongsTo
    {
        return $this->belongsTo(RetourVente::class, 'retour_vente_id');
    }

    public function livraisonLine(): BelongsTo
    {
        return $this->belongsTo(LivraisonLine::class, 'livraison_line_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function entrepot(): BelongsTo
    {
        return $this->belongsTo(Entrepot::class, 'entrepot_id');
    }

    public function saleUnit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'sale_unit_id');
    }

    public function tauxTva(): BelongsTo
    {
        return $this->belongsTo(TauxTva::class, 'taux_tva_id');
    }

    public function lots(): HasMany
    {
        return $this->hasMany(RetourVenteLineLot::class, 'retour_vente_line_id');
    }
}
