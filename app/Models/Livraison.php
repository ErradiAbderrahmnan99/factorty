<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Livraison extends Model
{
    use HasFactory;

    protected $table = 'livraisons';

    protected $fillable = [
        'ref',
        'tier_id',
        'commercial',
        'date_livraison',
        'devise_id',
        'commande_id',
        'status',
        'total_ht',
        'total_tva',
        'total_ttc',
    ];

    protected $casts = [
        'date_livraison' => 'date:Y-m-d',
        'commande_id' => 'integer',
        'total_ht' => 'double',
        'total_tva' => 'double',
        'total_ttc' => 'double',
    ];

    public function tier(): BelongsTo
    {
        return $this->belongsTo(Tier::class, 'tier_id');
    }

    public function devise(): BelongsTo
    {
        return $this->belongsTo(Devise::class, 'devise_id');
    }

    public function commande(): BelongsTo
    {
        return $this->belongsTo(Commande::class, 'commande_id');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(LivraisonLine::class, 'livraison_id');
    }

    public function factures(): HasMany
    {
        return $this->hasMany(FactureVente::class, 'livraison_id');
    }

    public function syncFacturationStatus(): void
    {
        if (!in_array($this->status, ['valide', 'facturé', 'facturé partiellement'])) {
            return;
        }

        $lines = $this->lines;
        if ($lines->isEmpty()) {
            return;
        }

        $factureIds = FactureVente::where('livraison_id', $this->id)
            ->where('status', '!=', 'annulee')
            ->pluck('id');

        $invoicedQuantities = FactureVenteLine::whereIn('facture_vente_id', $factureIds)
            ->groupBy('product_id')
            ->selectRaw('product_id, SUM(qty) as total_qty')
            ->pluck('total_qty', 'product_id');

        $fullyInvoiced = true;
        $anyInvoiced = false;

        foreach ($lines as $line) {
            $deliveredQty = (double)$line->qty;
            $invoicedQty = (double)($invoicedQuantities[$line->product_id] ?? 0);

            if ($invoicedQty > 0) {
                $anyInvoiced = true;
            }
            if ($invoicedQty < $deliveredQty) {
                $fullyInvoiced = false;
            }
        }

        if ($fullyInvoiced) {
            $this->update(['status' => 'facturé']);
        } elseif ($anyInvoiced) {
            $this->update(['status' => 'facturé partiellement']);
        } else {
            $this->update(['status' => 'valide']);
        }
    }
}
