<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Devis extends Model
{
    use HasFactory;

    protected $table = 'devis';

    protected $fillable = [
        'ref',
        'tier_id',
        'commercial',
        'date_devis',
        'duree_validite',
        'devise_id',
        'branche_id',
        'status',
        'total_ht',
        'total_tva',
        'total_ttc',
    ];

    protected $casts = [
        'date_devis' => 'date:Y-m-d',
        'duree_validite' => 'integer',
        'devise_id' => 'integer',
        'branche_id' => 'integer',
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

    public function branche(): BelongsTo
    {
        return $this->belongsTo(Branche::class, 'branche_id');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(DevisLine::class, 'devis_id');
    }

    public function commandes(): HasMany
    {
        return $this->hasMany(Commande::class, 'devis_id');
    }

    public function recalculateOrderStatus(): void
    {
        $commandeIds = \App\Models\Commande::where('devis_id', $this->id)
            ->where('status', '!=', 'annule')
            ->pluck('id');

        $commandeLines = \App\Models\CommandeLine::whereIn('commande_id', $commandeIds)->get();

        $orderedQtyByLine = [];
        
        foreach ($this->lines as $line) {
            $orderedQtyByLine[$line->id] = 0.0;
        }

        foreach ($commandeLines as $cLine) {
            if ($cLine->devis_line_id) {
                if (isset($orderedQtyByLine[$cLine->devis_line_id])) {
                    $orderedQtyByLine[$cLine->devis_line_id] += (double)$cLine->qty;
                }
            } else {
                $matchingLine = $this->lines->where('product_id', $cLine->product_id)->first();
                if ($matchingLine) {
                    $orderedQtyByLine[$matchingLine->id] += (double)$cLine->qty;
                }
            }
        }

        $allFullyOrdered = true;
        $anyOrdered = false;

        foreach ($this->lines as $line) {
            $orderedQty = (double)($orderedQtyByLine[$line->id] ?? 0);
            $line->qty_commande = $orderedQty;
            $line->save();

            if ($orderedQty > 0) {
                $anyOrdered = true;
            }

            if ($orderedQty < (double)$line->qty) {
                $allFullyOrdered = false;
            }
        }

        if ($this->lines->isEmpty()) {
            $this->status = 'accepté';
        } elseif ($allFullyOrdered) {
            $this->status = 'commandé';
        } elseif ($anyOrdered) {
            $this->status = 'commandé partiellement';
        } else {
            $this->status = 'accepté';
        }
        $this->save();
    }
}
