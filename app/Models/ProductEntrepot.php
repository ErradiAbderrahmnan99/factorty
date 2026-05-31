<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductEntrepot extends Model
{
    use HasFactory;

    protected $table = 'entrepot_product';

    protected $fillable = [
        'entrepot_id',
        'product_id',
        'quantity',
    ];

    protected $casts = [
        'quantity' => 'double',
    ];

    public function entrepot(): BelongsTo
    {
        return $this->belongsTo(Entrepot::class, 'entrepot_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function lots(): HasMany
    {
        return $this->hasMany(ProductLot::class, 'entrepot_product_id');
    }

    /**
     * Helper to find ProductEntrepot by product_id and entrepot_id
     */
    public static function findProductEntrepot(int $productId, int $entrepotId): ?self
    {
        return self::where('product_id', $productId)
            ->where('entrepot_id', $entrepotId)
            ->first();
    }

    /**
     * Helper to create ProductEntrepot
     */
    public static function createProductEntrepot(int $productId, int $entrepotId, float $quantity): self
    {
        return self::create([
            'product_id' => $productId,
            'entrepot_id' => $entrepotId,
            'quantity' => $quantity,
        ]);
    }
}
