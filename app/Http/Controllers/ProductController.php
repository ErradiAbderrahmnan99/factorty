<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Unit;
use App\Models\UnitCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->input('search');
        $status = $request->input('status');
        $categoryId = $request->input('product_category_id');

        $products = Product::query()
            ->with(['productCategory', 'unitCategory', 'stockUnit', 'purchaseUnit', 'saleUnit'])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('label', 'like', "%{$search}%")
                        ->orWhere('ref', 'like', "%{$search}%");
                });
            })
            ->when($status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($categoryId, function ($query, $categoryId) {
                $query->where('product_category_id', $categoryId);
            })
            ->orderBy('label')
            ->paginate(10)
            ->withQueryString();

        $productCategories = ProductCategory::orderBy('name')->get();

        return Inertia::render('Product/Index', [
            'products' => $products,
            'productCategories' => $productCategories,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'product_category_id' => $categoryId,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Product/Create', [
            'productCategories' => ProductCategory::orderBy('name')->get(),
            'unitCategories' => UnitCategory::orderBy('label')->get(),
            'units' => Unit::orderBy('label')->get(),
            'branches' => \App\Models\Branche::orderBy('name')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'product_category_id' => ['required', 'exists:product_categories,id'],
            'ref' => ['nullable', 'string', 'max:100', 'unique:products,ref'],
            'label' => ['required', 'string', 'max:255'],
            'unit_category_id' => ['required', 'exists:unit_categories,id'],
            'stock_unit_id' => ['required', 'exists:units,id'],
            'purchase_unit_id' => ['required', 'exists:units,id'],
            'sale_unit_id' => ['required', 'exists:units,id'],
            'length' => ['nullable', 'numeric', 'min:0'],
            'height' => ['nullable', 'numeric', 'min:0'],
            'width' => ['nullable', 'numeric', 'min:0'],
            'stock_limit' => ['required', 'numeric', 'min:0'],
            'sale_price' => ['required', 'numeric', 'min:0'],
            'purchase_price' => ['required', 'numeric', 'min:0'],
            'image' => ['nullable', 'image', 'max:2048'], // Max 2MB image
            'status' => ['required', 'in:actif,inactif'],
            'manage_by_lot' => ['nullable', 'boolean'],
            'stock_negative' => ['nullable', 'boolean'],
            'branches' => ['nullable', 'array'],
            'branches.*' => ['exists:branches,id'],
        ]);

        $validated['manage_by_lot'] = $request->boolean('manage_by_lot');
        $validated['stock_negative'] = $request->boolean('stock_negative');

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('products', 'public');
            $validated['image_path'] = $path;
        }

        $product = Product::create($validated);

        if ($request->has('branches')) {
            $product->branches()->sync($request->input('branches'));
        }

        return redirect()->route('products.index')
            ->with('success', 'Produit créé avec succès.');
    }

    public function edit(Product $product): Response
    {
        return Inertia::render('Product/Edit', [
            'product' => $product->load('branches'),
            'productCategories' => ProductCategory::orderBy('name')->get(),
            'unitCategories' => UnitCategory::orderBy('label')->get(),
            'units' => Unit::orderBy('label')->get(),
            'branches' => \App\Models\Branche::orderBy('name')->get(),
        ]);
    }

    public function update(Request $request, Product $product): RedirectResponse
    {
        // Handle standard Inertia request or multipart POST override (using _method: PUT)
        $validated = $request->validate([
            'product_category_id' => ['required', 'exists:product_categories,id'],
            'ref' => ['nullable', 'string', 'max:100', "unique:products,ref,{$product->id}"],
            'label' => ['required', 'string', 'max:255'],
            'unit_category_id' => ['required', 'exists:unit_categories,id'],
            'stock_unit_id' => ['required', 'exists:units,id'],
            'purchase_unit_id' => ['required', 'exists:units,id'],
            'sale_unit_id' => ['required', 'exists:units,id'],
            'length' => ['nullable', 'numeric', 'min:0'],
            'height' => ['nullable', 'numeric', 'min:0'],
            'width' => ['nullable', 'numeric', 'min:0'],
            'stock_limit' => ['required', 'numeric', 'min:0'],
            'sale_price' => ['required', 'numeric', 'min:0'],
            'purchase_price' => ['required', 'numeric', 'min:0'],
            'image' => ['nullable', 'image', 'max:2048'], // Max 2MB
            'status' => ['required', 'in:actif,inactif'],
            'manage_by_lot' => ['nullable', 'boolean'],
            'stock_negative' => ['nullable', 'boolean'],
            'branches' => ['nullable', 'array'],
            'branches.*' => ['exists:branches,id'],
        ]);

        $validated['manage_by_lot'] = $request->boolean('manage_by_lot');
        $validated['stock_negative'] = $request->boolean('stock_negative');

        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($product->image_path) {
                Storage::disk('public')->delete($product->image_path);
            }
            $path = $request->file('image')->store('products', 'public');
            $validated['image_path'] = $path;
        }

        $product->update($validated);

        if ($request->has('branches')) {
            $product->branches()->sync($request->input('branches'));
        } else {
            $product->branches()->sync([]);
        }

        return redirect()->route('products.index')
            ->with('success', 'Produit mis à jour avec succès.');
    }

    public function toggleStatus(Product $product): RedirectResponse
    {
        $product->status = $product->status === 'actif' ? 'inactif' : 'actif';
        $product->save();

        return redirect()->back()
            ->with('success', 'Statut du produit mis à jour.');
    }

    public function destroy(Product $product): RedirectResponse
    {
        if ($product->image_path) {
            Storage::disk('public')->delete($product->image_path);
        }

        $product->delete();

        return redirect()->route('products.index')
            ->with('success', 'Produit supprimé avec succès.');
    }
}
