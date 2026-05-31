import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useState, useEffect } from 'react';

interface ProductCategory {
    id: number;
    name: string;
}

interface UnitCategory {
    id: number;
    label: string;
}

interface Unit {
    id: number;
    unit_category_id: number;
    label: string;
    code: string | null;
}

export default function Create({
    productCategories,
    unitCategories,
    units,
}: {
    productCategories: ProductCategory[];
    unitCategories: UnitCategory[];
    units: Unit[];
}) {
    const { data, setData, post, processing, errors } = useForm({
        product_category_id: '',
        ref: '',
        label: '',
        unit_category_id: '',
        stock_unit_id: '',
        purchase_unit_id: '',
        sale_unit_id: '',
        length: '',
        height: '',
        width: '',
        stock_limit: '0.0000',
        sale_price: '0.0000',
        purchase_price: '0.0000',
        image: null as File | null,
        status: 'actif',
        manage_by_lot: false,
        stock_negative: false,
    });

    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [filteredUnits, setFilteredUnits] = useState<Unit[]>([]);

    // Filter units based on selected unit category
    useEffect(() => {
        if (data.unit_category_id) {
            const catId = Number(data.unit_category_id);
            const filtered = units.filter(u => u.unit_category_id === catId);
            setFilteredUnits(filtered);

            // Pre-select first unit of the category for all fields if currently empty or not in category
            if (filtered.length > 0) {
                const firstUnitId = String(filtered[0].id);
                setData(prev => ({
                    ...prev,
                    stock_unit_id: firstUnitId,
                    purchase_unit_id: firstUnitId,
                    sale_unit_id: firstUnitId,
                }));
            } else {
                setData(prev => ({
                    ...prev,
                    stock_unit_id: '',
                    purchase_unit_id: '',
                    sale_unit_id: '',
                }));
            }
        } else {
            setFilteredUnits([]);
            setData(prev => ({
                ...prev,
                stock_unit_id: '',
                purchase_unit_id: '',
                sale_unit_id: '',
            }));
        }
    }, [data.unit_category_id]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('image', file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setData('image', null);
            setImagePreview(null);
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('products.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 max-w-5xl mx-auto">
                    <div>
                        <div className="flex items-center space-x-2 text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                            <span>Données de base</span>
                            <span>/</span>
                            <span>Produits</span>
                            <span>/</span>
                            <span className="text-indigo-600 dark:text-indigo-400">Nouveau Produit</span>
                        </div>
                        <div className="flex items-center mt-1.5 flex-wrap">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight inline-block">
                                Créer un Produit
                            </h2>
                        </div>
                    </div>

                    <Link
                        href={route('products.index')}
                        className="inline-flex items-center justify-center space-x-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-750 font-bold text-xs uppercase tracking-widest rounded-2xl transition-all duration-200 self-center shrink-0 h-[42px] px-6"
                    >
                        Retour à la liste
                    </Link>
                </div>
            }
        >
            <Head title="Nouveau Produit" />

            <div className="max-w-5xl mx-auto">
                <form onSubmit={submit} className="space-y-6">
                    {/* Main Layout Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* LEFT COLUMN: Main Form Specifications */}
                        <div className="lg:col-span-2 space-y-6">
                            
                            {/* Card 1: Identification */}
                            <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-none rounded-3xl p-6 backdrop-blur-xl transition-all duration-300 space-y-4">
                                <h3 className="text-xs font-extrabold text-slate-850 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/60 pb-3 mb-2">
                                    Identification du Produit
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <InputLabel htmlFor="label" value="Libellé / Nom du Produit" />
                                        <TextInput
                                            id="label"
                                            className="mt-1.5 py-3 px-4 bg-slate-50 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-800/80 rounded-2xl text-xs focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all duration-300"
                                            value={data.label}
                                            onChange={(e) => setData('label', e.target.value)}
                                            placeholder="ex: Engrenage Cylindrique 12 Dents"
                                            required
                                        />
                                        <InputError className="mt-2" message={errors.label} />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="ref" value="Référence (Code Unique)" />
                                        <TextInput
                                            id="ref"
                                            className="mt-1.5 py-3 px-4 bg-slate-50 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-800/80 rounded-2xl text-xs focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all duration-300 font-mono"
                                            value={data.ref}
                                            onChange={(e) => setData('ref', e.target.value)}
                                            placeholder="ex: PRD-2026-009"
                                        />
                                        <InputError className="mt-2" message={errors.ref} />
                                    </div>
                                </div>

                                <div>
                                    <InputLabel htmlFor="product_category_id" value="Catégorie de Produit" />
                                    <select
                                        id="product_category_id"
                                        className="mt-1.5 block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs text-slate-800 dark:text-slate-350 focus:outline-none focus:bg-white dark:focus:bg-slate-950 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all duration-300 py-3 px-4"
                                        value={data.product_category_id}
                                        onChange={(e) => setData('product_category_id', e.target.value)}
                                        required
                                    >
                                        <option value="" className="text-slate-400">Choisir une catégorie...</option>
                                        {productCategories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError className="mt-2" message={errors.product_category_id} />
                                </div>
                            </div>

                            {/* Card 2: Units System */}
                            <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-none rounded-3xl p-6 backdrop-blur-xl transition-all duration-300 space-y-4">
                                <h3 className="text-xs font-extrabold text-slate-850 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/60 pb-3 mb-2">
                                    Système d'Unités & Équivalences
                                </h3>

                                <div>
                                    <InputLabel htmlFor="unit_category_id" value="Catégorie d'Unité Principale" />
                                    <select
                                        id="unit_category_id"
                                        className="mt-1.5 block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs text-slate-800 dark:text-slate-350 focus:outline-none focus:bg-white dark:focus:bg-slate-950 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all duration-300 py-3 px-4"
                                        value={data.unit_category_id}
                                        onChange={(e) => setData('unit_category_id', e.target.value)}
                                        required
                                    >
                                        <option value="" className="text-slate-400">Choisir une catégorie d'unité...</option>
                                        {unitCategories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.label}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError className="mt-2" message={errors.unit_category_id} />
                                </div>

                                {data.unit_category_id && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 animate-fade-in">
                                        <div>
                                            <InputLabel htmlFor="stock_unit_id" value="Unité de Stock" />
                                            <select
                                                id="stock_unit_id"
                                                className="mt-1.5 block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs text-slate-800 dark:text-slate-355 focus:outline-none focus:bg-white dark:focus:bg-slate-950 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all duration-300 py-3 px-4"
                                                value={data.stock_unit_id}
                                                onChange={(e) => setData('stock_unit_id', e.target.value)}
                                                required
                                            >
                                                {filteredUnits.map((u) => (
                                                    <option key={u.id} value={u.id}>{u.label} ({u.code})</option>
                                                ))}
                                            </select>
                                            <InputError className="mt-2" message={errors.stock_unit_id} />
                                        </div>

                                        <div>
                                            <InputLabel htmlFor="purchase_unit_id" value="Unité d'Achat" />
                                            <select
                                                id="purchase_unit_id"
                                                className="mt-1.5 block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs text-slate-800 dark:text-slate-355 focus:outline-none focus:bg-white dark:focus:bg-slate-950 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all duration-300 py-3 px-4"
                                                value={data.purchase_unit_id}
                                                onChange={(e) => setData('purchase_unit_id', e.target.value)}
                                                required
                                            >
                                                {filteredUnits.map((u) => (
                                                    <option key={u.id} value={u.id}>{u.label} ({u.code})</option>
                                                ))}
                                            </select>
                                            <InputError className="mt-2" message={errors.purchase_unit_id} />
                                        </div>

                                        <div>
                                            <InputLabel htmlFor="sale_unit_id" value="Unité de Vente" />
                                            <select
                                                id="sale_unit_id"
                                                className="mt-1.5 block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs text-slate-800 dark:text-slate-355 focus:outline-none focus:bg-white dark:focus:bg-slate-950 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all duration-300 py-3 px-4"
                                                value={data.sale_unit_id}
                                                onChange={(e) => setData('sale_unit_id', e.target.value)}
                                                required
                                            >
                                                {filteredUnits.map((u) => (
                                                    <option key={u.id} value={u.id}>{u.label} ({u.code})</option>
                                                ))}
                                            </select>
                                            <InputError className="mt-2" message={errors.sale_unit_id} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Card 3: Dimensions & Pricing */}
                            <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-none rounded-3xl p-6 backdrop-blur-xl transition-all duration-300 space-y-4">
                                <h3 className="text-xs font-extrabold text-slate-850 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/60 pb-3 mb-2">
                                    Spécifications & Tarification
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div>
                                        <InputLabel htmlFor="length" value="Longueur (mm)" />
                                        <TextInput
                                            id="length"
                                            type="number"
                                            step="0.0001"
                                            className="mt-1.5 py-3 px-4 bg-slate-50 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-800/80 rounded-2xl text-xs focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all duration-300 font-mono"
                                            value={data.length}
                                            onChange={(e) => setData('length', e.target.value)}
                                            placeholder="0.00"
                                        />
                                        <InputError className="mt-2" message={errors.length} />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="height" value="Hauteur (mm)" />
                                        <TextInput
                                            id="height"
                                            type="number"
                                            step="0.0001"
                                            className="mt-1.5 py-3 px-4 bg-slate-50 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-800/80 rounded-2xl text-xs focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all duration-300 font-mono"
                                            value={data.height}
                                            onChange={(e) => setData('height', e.target.value)}
                                            placeholder="0.00"
                                        />
                                        <InputError className="mt-2" message={errors.height} />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="width" value="Largeur (mm)" />
                                        <TextInput
                                            id="width"
                                            type="number"
                                            step="0.0001"
                                            className="mt-1.5 py-3 px-4 bg-slate-50 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-800/80 rounded-2xl text-xs focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all duration-300 font-mono"
                                            value={data.width}
                                            onChange={(e) => setData('width', e.target.value)}
                                            placeholder="0.00"
                                        />
                                        <InputError className="mt-2" message={errors.width} />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="stock_limit" value="Stock Limite" />
                                        <TextInput
                                            id="stock_limit"
                                            type="number"
                                            step="0.0001"
                                            className="mt-1.5 py-3 px-4 bg-slate-50 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-800/80 rounded-2xl text-xs focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all duration-300 font-mono"
                                            value={data.stock_limit}
                                            onChange={(e) => setData('stock_limit', e.target.value)}
                                            placeholder="0.00"
                                            required
                                        />
                                        <InputError className="mt-2" message={errors.stock_limit} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <InputLabel htmlFor="purchase_price" value="Prix d'Achat (DH)" />
                                        <TextInput
                                            id="purchase_price"
                                            type="number"
                                            step="0.01"
                                            className="mt-1.5 py-3 px-4 bg-slate-50 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-800/80 rounded-2xl text-xs focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all duration-300 font-mono font-bold text-rose-500"
                                            value={data.purchase_price}
                                            onChange={(e) => setData('purchase_price', e.target.value)}
                                            placeholder="0.00"
                                            required
                                        />
                                        <InputError className="mt-2" message={errors.purchase_price} />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="sale_price" value="Prix de Vente (DH)" />
                                        <TextInput
                                            id="sale_price"
                                            type="number"
                                            step="0.01"
                                            className="mt-1.5 py-3 px-4 bg-slate-50 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-800/80 rounded-2xl text-xs focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all duration-300 font-mono font-bold text-emerald-500"
                                            value={data.sale_price}
                                            onChange={(e) => setData('sale_price', e.target.value)}
                                            placeholder="0.00"
                                            required
                                        />
                                        <InputError className="mt-2" message={errors.sale_price} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Media Upload & Status Details */}
                        <div className="space-y-6 col-span-1">
                            
                            {/* Card 4: Image Upload Dropzone */}
                            <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-none rounded-3xl p-6 backdrop-blur-xl transition-all duration-300 space-y-4">
                                <h3 className="text-xs font-extrabold text-slate-850 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/60 pb-3 mb-2">
                                    Image du Produit
                                </h3>

                                <div className="space-y-3">
                                    {imagePreview ? (
                                        <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                                            <img src={imagePreview} alt="Preview" className="w-full h-44 object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setData('image', null);
                                                    setImagePreview(null);
                                                }}
                                                className="absolute top-3 right-3 p-2 bg-rose-600/90 text-white rounded-xl hover:bg-rose-700 transition-all shadow-md active:scale-95"
                                            >
                                                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-9v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-500 rounded-3xl p-6 bg-slate-50/50 dark:bg-slate-950/20 cursor-pointer transition-all duration-300 group">
                                            <svg className="h-10 w-10 text-slate-400 group-hover:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span className="text-[11px] font-bold text-slate-650 dark:text-slate-350 mt-3 block">Glisser ou sélectionner</span>
                                            <span className="text-[9px] text-slate-400 mt-1 block">PNG, JPG, JPEG (Max 2 Mo)</span>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                        </label>
                                    )}
                                    <InputError message={errors.image} />
                                </div>
                            </div>

                            {/* Card 5: Status Option */}
                            <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-none rounded-3xl p-6 backdrop-blur-xl transition-all duration-300 space-y-4">
                                <h3 className="text-xs font-extrabold text-slate-850 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/60 pb-3 mb-2">
                                    Statut Initial
                                </h3>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setData('status', 'actif')}
                                        className={`py-3 px-4 rounded-2xl text-xs font-extrabold uppercase tracking-wider transition-all duration-200 ${
                                            data.status === 'actif'
                                                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                                                : 'bg-slate-50 dark:bg-slate-950/20 text-slate-400 border border-transparent'
                                        }`}
                                    >
                                        Actif
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setData('status', 'inactif')}
                                        className={`py-3 px-4 rounded-2xl text-xs font-extrabold uppercase tracking-wider transition-all duration-200 ${
                                            data.status === 'inactif'
                                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 border border-slate-200 dark:border-slate-700'
                                                : 'bg-slate-50 dark:bg-slate-950/20 text-slate-400 border border-transparent'
                                        }`}
                                    >
                                        Inactif
                                    </button>
                                </div>
                            </div>

                            {/* Card: Stock Options */}
                            <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-none rounded-3xl p-6 backdrop-blur-xl transition-all duration-300 space-y-4">
                                <h3 className="text-xs font-extrabold text-slate-850 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/60 pb-3 mb-2">
                                    Paramètres Stock
                                </h3>

                                <div className="space-y-4">
                                    <label className="flex items-center space-x-3 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            className="rounded-lg border-slate-250 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500/20 h-5 w-5 transition-all cursor-pointer"
                                            checked={data.manage_by_lot}
                                            onChange={(e) => setData('manage_by_lot', e.target.checked)}
                                        />
                                        <div>
                                            <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">Gérer par lot</span>
                                            <span className="block text-[10px] text-slate-400 dark:text-slate-500">Activer la traçabilité par lot pour ce produit</span>
                                        </div>
                                    </label>

                                    <label className="flex items-center space-x-3 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            className="rounded-lg border-slate-250 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500/20 h-5 w-5 transition-all cursor-pointer"
                                            checked={data.stock_negative}
                                            onChange={(e) => setData('stock_negative', e.target.checked)}
                                        />
                                        <div>
                                            <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">Stock négatif autorisé</span>
                                            <span className="block text-[10px] text-slate-400 dark:text-slate-500">Autoriser les ventes même si le stock est épuisé</span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Submit & Reset Area */}
                            <div className="flex items-center space-x-3 w-full">
                                <Link
                                    href={route('products.index')}
                                    className="flex-1 inline-flex items-center justify-center py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-750 transition-all duration-200 text-center"
                                >
                                    Annuler
                                </Link>
                                <PrimaryButton
                                    className="flex-1 py-3.5"
                                    disabled={processing}
                                >
                                    Enregistrer
                                </PrimaryButton>
                            </div>
                        </div>

                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
