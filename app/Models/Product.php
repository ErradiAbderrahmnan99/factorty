<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Facades\Storage;

use App\Traits\HasBranches;

class Product extends Model
{
    use HasFactory, HasBranches;

    protected $fillable = [
        'product_category_id',
        'ref',
        'label',
        'unit_category_id',
        'stock_unit_id',
        'purchase_unit_id',
        'sale_unit_id',
        'length',
        'height',
        'width',
        'stock_limit',
        'sale_price',
        'purchase_price',
        'image_path',
        'status',
        'manage_by_lot',
        'stock_negative',
    ];

    protected $casts = [
        'length' => 'double',
        'height' => 'double',
        'width' => 'double',
        'stock_limit' => 'double',
        'sale_price' => 'double',
        'purchase_price' => 'double',
        'manage_by_lot' => 'boolean',
        'stock_negative' => 'boolean',
    ];

    protected $appends = [
        'image_url',
    ];

    public function getImageUrlAttribute(): ?string
    {
        if ($this->image_path) {
            return Storage::url($this->image_path);
        }
        return null;
    }

    public function productCategory(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class, 'product_category_id');
    }

    public function unitCategory(): BelongsTo
    {
        return $this->belongsTo(UnitCategory::class, 'unit_category_id');
    }

    public function stockUnit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'stock_unit_id');
    }

    public function purchaseUnit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'purchase_unit_id');
    }

    public function saleUnit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'sale_unit_id');
    }

    public function entrepots(): BelongsToMany
    {
        return $this->belongsToMany(Entrepot::class, 'entrepot_product');
    }
}
