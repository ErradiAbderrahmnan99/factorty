<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Commande extends Model
{
    use HasFactory;

    protected $table = 'commandes';

    protected $fillable = [
        'ref',
        'tier_id',
        'commercial',
        'date_commande',
        'devise_id',
        'devis_id',
        'status',
        'total_ht',
        'total_tva',
        'total_ttc',
    ];

    protected $casts = [
        'date_commande' => 'date:Y-m-d',
        'devis_id' => 'integer',
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

    public function devis(): BelongsTo
    {
        return $this->belongsTo(Devis::class, 'devis_id');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(CommandeLine::class, 'commande_id');
    }

    public function livraisons(): HasMany
    {
        return $this->hasMany(Livraison::class, 'commande_id');
    }

    public function recalculateDeliveryStatus(): void
    {
        $livraisonIds = \App\Models\Livraison::where('commande_id', $this->id)
            ->where('status', '!=', 'annule')
            ->pluck('id');

        $deliveredQtyByLine = \App\Models\LivraisonLine::whereIn('livraison_id', $livraisonIds)
            ->whereNotNull('commande_line_id')
            ->groupBy('commande_line_id')
            ->selectRaw('commande_line_id, SUM(qty) as total_qty')
            ->pluck('total_qty', 'commande_line_id');

        $allFullyDelivered = true;
        $anyDelivered = false;

        foreach ($this->lines as $line) {
            $deliveredQty = (double)($deliveredQtyByLine[$line->id] ?? 0);
            $line->qty_livre = $deliveredQty;
            $line->save();

            if ($deliveredQty > 0) {
                $anyDelivered = true;
            }

            if ($deliveredQty < (double)$line->qty) {
                $allFullyDelivered = false;
            }
        }

        if ($this->lines->isEmpty()) {
            $this->status = 'valide';
        } elseif ($allFullyDelivered) {
            $this->status = 'livré';
        } elseif ($anyDelivered) {
            $this->status = 'livré partiellement';
        } else {
            $this->status = 'valide';
        }
        $this->save();
    }
}
