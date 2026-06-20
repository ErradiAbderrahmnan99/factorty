<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CommandeLine extends Model
{
    use HasFactory;

    protected $table = 'commande_lines';

    protected $fillable = [
        'commande_id',
        'devis_line_id',
        'product_id',
        'entrepot_id',
        'sale_unit_id',
        'taux_tva_id',
        'qty',
        'qty_livre',
        'pu_ht',
        'pu_ttc',
        'remise',
        'rm',
        'total_ht',
        'total_ttc',
    ];

    protected $casts = [
        'devis_line_id' => 'integer',
        'tva' => 'double',
        'qty' => 'double',
        'qty_livre' => 'double',
        'pu_ht' => 'double',
        'pu_ttc' => 'double',
        'remise' => 'double',
        'rm' => 'double',
        'total_ht' => 'double',
        'total_ttc' => 'double',
    ];

    public function commande(): BelongsTo
    {
        return $this->belongsTo(Commande::class, 'commande_id');
    }

    public function devisLine(): BelongsTo
    {
        return $this->belongsTo(DevisLine::class, 'devis_line_id');
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
        return $this->hasMany(CommandeLineLot::class, 'commande_line_id');
    }
}
