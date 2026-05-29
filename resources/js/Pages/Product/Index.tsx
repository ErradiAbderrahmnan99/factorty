import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import SecondaryButton from '@/Components/SecondaryButton';

interface ProductCategory {
    id: number;
    name: string;
}

interface Unit {
    id: number;
    label: string;
    code: string | null;
}

interface Product {
    id: number;
    ref: string | null;
    label: string;
    product_category_id: number;
    unit_category_id: number;
    stock_unit_id: number;
    purchase_unit_id: number;
    sale_unit_id: number;
    length: number | null;
    height: number | null;
    width: number | null;
    stock_limit: number;
    sale_price: number;
    purchase_price: number;
    image_url: string | null;
    status: 'actif' | 'inactif';
    product_category?: ProductCategory;
    stock_unit?: Unit;
    purchase_unit?: Unit;
    sale_unit?: Unit;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedProducts {
    data: Product[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLink[];
}

export default function Index({
    products,
    productCategories,
    filters,
}: {
    products: PaginatedProducts;
    productCategories: ProductCategory[];
    filters: { search: string | null; status: string | null; product_category_id: string | null };
}) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [categoryFilter, setCategoryFilter] = useState(filters.product_category_id || '');
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
    
    const isFirstRender = useRef(true);

    // Filter updates (Skipped on initial render to prevent resetting page parameter)
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        const timeOutId = setTimeout(() => {
            router.get(
                route('products.index'),
                {
                    search: search || undefined,
                    status: statusFilter || undefined,
                    product_category_id: categoryFilter || undefined,
                },
                { preserveState: true, replace: true }
            );
        }, 300);
        return () => clearTimeout(timeOutId);
    }, [search, statusFilter, categoryFilter]);

    const toggleProductStatus = (product: Product) => {
        router.post(
            route('products.toggle-status', product.id),
            {},
            { preserveScroll: true }
        );
    };

    const openDeleteModal = (product: Product) => {
        setDeletingProduct(product);
        setIsDeleteOpen(true);
    };

    const submitDelete = (e: React.FormEvent) => {
        e.preventDefault();
        if (deletingProduct) {
            router.delete(route('products.destroy', deletingProduct.id), {
                onSuccess: () => {
                    setIsDeleteOpen(false);
                    setDeletingProduct(null);
                },
            });
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 max-w-7xl mx-auto">
                    <div>
                        <div className="flex items-center space-x-2 text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                            <span>Données de base</span>
                            <span>/</span>
                            <span>Produits</span>
                            <span>/</span>
                            <span className="text-indigo-600 dark:text-indigo-400">Liste des Produits</span>
                        </div>
                        <div className="flex items-center mt-1.5 flex-wrap">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight inline-block">
                                Produits
                            </h2>
                            <span className="text-slate-350 dark:text-slate-600 font-bold select-none text-sm inline-block leading-none" style={{ marginLeft: '12px', marginRight: '12px' }}>•</span>
                            <span 
                                className="inline-block px-2.5 py-1 text-[10px] font-extrabold bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 rounded-lg uppercase tracking-wider"
                            >
                                {products.total} au total
                            </span>
                        </div>
                    </div>

                    <Link
                        href={route('products.create')}
                        className="inline-flex items-center justify-center space-x-2 text-white font-bold text-xs uppercase tracking-widest rounded-2xl transition-all duration-200 shadow-lg shadow-indigo-500/20 active:scale-[0.97] self-center shrink-0"
                        style={{ 
                            backgroundColor: '#4f46e5', 
                            color: '#ffffff',
                            height: '42px',
                            paddingLeft: '24px',
                            paddingRight: '24px'
                        }}
                    >
                        <svg className="h-4 w-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Nouveau Produit</span>
                    </Link>
                </div>
            }
        >
            <Head title="Produits" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Modern Filters Card */}
                <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-none rounded-3xl p-6 backdrop-blur-xl transition-all duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Search Field */}
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                className="pl-11 pr-4 py-3 w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl text-xs placeholder-slate-400 text-slate-800 dark:text-slate-350 focus:outline-none focus:bg-white dark:focus:bg-slate-950 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all duration-300"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Rechercher par référence, libellé..."
                            />
                        </div>

                        {/* Category Filter */}
                        <div>
                            <select
                                className="py-3 px-4 w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl text-xs text-slate-800 dark:text-slate-350 focus:outline-none focus:bg-white dark:focus:bg-slate-950 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all duration-300"
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                            >
                                <option value="">Toutes les catégories</option>
                                {productCategories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div>
                            <select
                                className="py-3 px-4 w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl text-xs text-slate-800 dark:text-slate-350 focus:outline-none focus:bg-white dark:focus:bg-slate-950 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all duration-300"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="">Tous les statuts</option>
                                <option value="actif">Actif</option>
                                <option value="inactif">Inactif</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Floating Datatable Card */}
                <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-none rounded-3xl overflow-hidden backdrop-blur-xl transition-all duration-300">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800/50">
                                    <th className="py-4.5 px-6 text-[10px] font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-widest w-12 text-center">Image</th>
                                    <th className="py-4.5 px-6 text-[10px] font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-widest w-40">Référence</th>
                                    <th className="py-4.5 px-6 text-[10px] font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-widest w-1/4">Nom / Libellé</th>
                                    <th className="py-4.5 px-6 text-[10px] font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-widest">Catégorie</th>
                                    <th className="py-4.5 px-6 text-[10px] font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-widest">Unités (S / A / V)</th>
                                    <th className="py-4.5 px-6 text-[10px] font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-widest">Prix (Achat / Vente)</th>
                                    <th className="py-4.5 px-6 text-[10px] font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-widest text-center w-28">Statut</th>
                                    <th className="py-4.5 px-6 text-[10px] font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-widest text-center w-28">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/70 dark:divide-slate-800/70 bg-white dark:bg-transparent">
                                {products.data.length > 0 ? (
                                    products.data.map((product) => (
                                        <tr key={product.id} className="hover:bg-indigo-50/20 dark:hover:bg-indigo-950/5 transition-all duration-200 group">
                                            {/* Product Image */}
                                            <td className="py-4 px-6 whitespace-nowrap text-center">
                                                {product.image_url ? (
                                                    <img
                                                        src={product.image_url}
                                                        alt={product.label}
                                                        className="h-10 w-10 rounded-xl object-cover border border-slate-200 dark:border-slate-800 inline-block shadow-sm"
                                                    />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200/50 dark:border-slate-700/50 inline-block text-slate-400">
                                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </td>

                                            {/* Reference */}
                                            <td className="py-4 px-6 whitespace-nowrap">
                                                {product.ref ? (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/50 dark:border-slate-700/50 font-mono text-[10px] font-extrabold tracking-wider">
                                                        {product.ref}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-350 dark:text-slate-700 font-mono text-xs">—</span>
                                                )}
                                            </td>

                                            {/* Label Name & Dimensions */}
                                            <td className="py-4 px-6">
                                                <div className="text-xs font-extrabold text-slate-850 dark:text-slate-100">
                                                    {product.label}
                                                </div>
                                                {(product.length || product.height || product.width) && (
                                                    <div className="text-[10px] text-slate-400 mt-1 font-mono">
                                                        Dim: {product.length || '0'} x {product.height || '0'} x {product.width || '0'} mm
                                                    </div>
                                                )}
                                            </td>

                                            {/* Category */}
                                            <td className="py-4 px-6 whitespace-nowrap text-xs font-semibold text-slate-650 dark:text-slate-300">
                                                {product.product_category?.name || <span className="text-rose-500 dark:text-rose-450 font-bold">Non défini</span>}
                                            </td>

                                            {/* Units stock / purchase / sale */}
                                            <td className="py-4 px-6 whitespace-nowrap text-xs text-slate-550 dark:text-slate-400">
                                                <div className="flex items-center space-x-1.5">
                                                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px] font-bold" title="Stock Unit">
                                                        S: {product.stock_unit?.code || '—'}
                                                    </span>
                                                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px] font-bold" title="Purchase Unit">
                                                        A: {product.purchase_unit?.code || '—'}
                                                    </span>
                                                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px] font-bold" title="Sale Unit">
                                                        V: {product.sale_unit?.code || '—'}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Purchase / Sale Price */}
                                            <td className="py-4 px-6 whitespace-nowrap">
                                                <div className="text-xs text-slate-800 dark:text-slate-200">
                                                    <span className="text-rose-500 font-bold" title="Prix d'achat">
                                                        {Number(product.purchase_price).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH
                                                    </span>
                                                    <span className="text-slate-300 dark:text-slate-750 mx-1.5">•</span>
                                                    <span className="text-emerald-500 font-black" title="Prix de vente">
                                                        {Number(product.sale_price).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Interactive Status Switch */}
                                            <td className="py-4 px-6 whitespace-nowrap text-center">
                                                <button
                                                    onClick={() => toggleProductStatus(product)}
                                                    className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer active:scale-95 ${
                                                        product.status === 'actif'
                                                            ? 'bg-emerald-500/10 text-emerald-650 dark:text-emerald-450 border border-emerald-500/20'
                                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50'
                                                    }`}
                                                    title="Cliquez pour changer le statut"
                                                >
                                                    <span className={`h-1.5 w-1.5 rounded-full ${product.status === 'actif' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                                    <span>{product.status}</span>
                                                </button>
                                            </td>

                                            {/* Actions */}
                                            <td className="py-4 px-6 whitespace-nowrap text-center">
                                                <div className="flex items-center justify-center space-x-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                                    <Link
                                                        href={route('products.edit', product.id)}
                                                        className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-all duration-250"
                                                        title="Modifier"
                                                    >
                                                        <svg className="h-4 w-4 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                        </svg>
                                                    </Link>
                                                    <button
                                                        onClick={() => openDeleteModal(product)}
                                                        className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-450 hover:bg-rose-500/10 rounded-xl transition-all duration-250"
                                                        title="Supprimer"
                                                    >
                                                        <svg className="h-4 w-4 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-9v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="py-20 text-center text-slate-450 dark:text-slate-500">
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-slate-900/60 flex items-center justify-center border border-slate-100 dark:border-slate-800">
                                                    <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Aucun produit trouvé</span>
                                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">Cliquez sur "Nouveau Produit" pour créer votre premier article.</span>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Layout (Metronic Style) */}
                    {products.last_page > 1 && (
                        <div className="p-6 border-t border-slate-100/80 dark:border-slate-800/60 flex items-center justify-between flex-wrap gap-4 bg-slate-50/10 dark:bg-slate-950/5">
                            <span className="text-xs text-slate-450 dark:text-slate-450">
                                Affichage de <span className="font-extrabold text-slate-800 dark:text-slate-200">{(products.current_page - 1) * products.per_page + 1}</span> à <span className="font-extrabold text-slate-800 dark:text-slate-200">{Math.min(products.current_page * products.per_page, products.total)}</span> sur <span className="font-extrabold text-slate-800 dark:text-slate-200">{products.total}</span> produits
                            </span>

                            <div className="flex items-center space-x-1.5">
                                {products.links.map((link, idx) => {
                                    const isPrev = link.label.includes('Previous');
                                    const isNext = link.label.includes('Next');
                                    
                                    // Custom Chevron Icons for a professional, premium visual layout
                                    const renderLabel = () => {
                                        if (isPrev) {
                                            return (
                                                <svg className="h-3.5 w-3.5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                                </svg>
                                            );
                                        }
                                        if (isNext) {
                                            return (
                                                <svg className="h-3.5 w-3.5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                                </svg>
                                            );
                                        }
                                        return <span className="font-black text-xs">{link.label}</span>;
                                    };

                                    if (!link.url) {
                                        return (
                                            <span
                                                key={idx}
                                                className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-300 dark:text-slate-700 select-none cursor-not-allowed border border-transparent"
                                            >
                                                {renderLabel()}
                                            </span>
                                        );
                                    }

                                    return (
                                        <Link
                                            key={idx}
                                            href={link.url}
                                            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-150 active:scale-90 border ${
                                                link.active
                                                    ? 'bg-indigo-600 text-white border-indigo-650 shadow-lg shadow-indigo-600/20'
                                                    : 'bg-transparent text-slate-500 dark:text-slate-400 border-transparent hover:border-slate-200 dark:hover:border-slate-800 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:text-slate-850 dark:hover:text-white'
                                            }`}
                                            preserveScroll
                                        >
                                            {renderLabel()}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* DELETE MODAL */}
            {isDeleteOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-md p-4">
                    <div 
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full rounded-3xl shadow-2xl p-6 overflow-hidden transform transition-all duration-300"
                        style={{ maxWidth: '400px' }}
                    >
                        <div className="flex items-center space-x-3 text-rose-500 mb-4">
                            <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                                <svg className="h-5 w-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-850 dark:text-white">
                                Supprimer ?
                            </h3>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed mb-6">
                            Êtes-vous sûr de vouloir supprimer le produit <span className="font-bold text-slate-800 dark:text-slate-100">"{deletingProduct?.label}"</span> ? Cette action est définitive.
                        </p>

                        <form onSubmit={submitDelete} className="flex items-center justify-end space-x-3">
                            <SecondaryButton 
                                onClick={() => setIsDeleteOpen(false)}
                            >
                                Annuler
                            </SecondaryButton>
                            <button
                                type="submit"
                                className="inline-flex items-center justify-center bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-widest px-5 py-3.5 rounded-2xl transition-all duration-200 active:scale-[0.97]"
                            >
                                Supprimer
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
