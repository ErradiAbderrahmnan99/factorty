<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Reception extends Model
{
    use HasFactory;

    protected $table = 'receptions';

    protected $fillable = [
        'ref',
        'tier_id',
        'date_reception',
        'devise_id',
        'mode_reglement_id',
        'condition_reglement_id',
        'compte_bancaire_id',
        'note_public',
        'note_private',
        'status',
        'total_ht',
        'total_tva',
        'total_ttc',
        'commande_achat_id',
    ];

    protected $casts = [
        'date_reception' => 'date:Y-m-d',
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

    public function modeReglement(): BelongsTo
    {
        return $this->belongsTo(ModeReglement::class, 'mode_reglement_id');
    }

    public function conditionReglement(): BelongsTo
    {
        return $this->belongsTo(ConditionReglement::class, 'condition_reglement_id');
    }

    public function compteBancaire(): BelongsTo
    {
        return $this->belongsTo(CompteBancaire::class, 'compte_bancaire_id');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(ReceptionLine::class, 'reception_id');
    }

    public function commandeAchat(): BelongsTo
    {
        return $this->belongsTo(CommandeAchat::class, 'commande_achat_id');
    }

    public function factures(): HasMany
    {
        return $this->hasMany(FactureAchat::class, 'reception_id');
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

        $factureIds = FactureAchat::where('reception_id', $this->id)
            ->where('status', '!=', 'annulee')
            ->pluck('id');

        $invoicedQuantities = FactureAchatLine::whereIn('facture_achat_id', $factureIds)
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
