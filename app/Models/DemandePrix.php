<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DemandePrix extends Model
{
    use HasFactory;

    protected $table = 'demandes_prix';

    protected $fillable = [
        'ref', 'date_demande', 'date_validite', 'employee_id', 'tier_id',
        'devise_id', 'mode_reglement_id', 'condition_reglement_id', 'compte_bancaire_id',
        'status', 'total_ht', 'total_tva', 'total_ttc',
        'note_public', 'note_private',
    ];

    protected $casts = [
        'date_demande'  => 'date:Y-m-d',
        'date_validite' => 'date:Y-m-d',
        'total_ht'      => 'double',
        'total_tva'     => 'double',
        'total_ttc'     => 'double',
    ];

    public function employee(): BelongsTo    { return $this->belongsTo(Employee::class, 'employee_id'); }
    public function tier(): BelongsTo        { return $this->belongsTo(Tier::class, 'tier_id'); }
    public function devise(): BelongsTo      { return $this->belongsTo(Devise::class, 'devise_id'); }
    public function modeReglement(): BelongsTo      { return $this->belongsTo(ModeReglement::class, 'mode_reglement_id'); }
    public function conditionReglement(): BelongsTo { return $this->belongsTo(ConditionReglement::class, 'condition_reglement_id'); }
    public function compteBancaire(): BelongsTo     { return $this->belongsTo(CompteBancaire::class, 'compte_bancaire_id'); }
    public function lines(): HasMany          { return $this->hasMany(DemandePrixLine::class, 'demande_prix_id'); }
    public function commandesAchat(): HasMany { return $this->hasMany(CommandeAchat::class, 'demande_prix_id'); }

    public function recalculateOrderStatus(): void
    {
        $commandeIds = \App\Models\CommandeAchat::where('demande_prix_id', $this->id)
            ->where('status', '!=', 'annulee')
            ->pluck('id');

        $commandeLines = \App\Models\CommandeAchatLine::whereIn('commande_achat_id', $commandeIds)->get();

        $orderedQtyByLine = [];
        
        foreach ($this->lines as $line) {
            $orderedQtyByLine[$line->id] = 0.0;
        }

        foreach ($commandeLines as $cLine) {
            if ($cLine->demande_prix_line_id) {
                if (isset($orderedQtyByLine[$cLine->demande_prix_line_id])) {
                    $orderedQtyByLine[$cLine->demande_prix_line_id] += (double)$cLine->qty;
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
            $this->status = 'valide';
        } elseif ($allFullyOrdered) {
            $this->status = 'commande';
        } elseif ($anyOrdered) {
            $this->status = 'commande partiellement';
        } else {
            $this->status = 'valide';
        }
        $this->save();
    }
}
