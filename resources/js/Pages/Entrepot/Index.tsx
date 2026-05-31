import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm, Link } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import InputError from '@/Components/InputError';


interface Employee {
    id: number;
    first_name: string;
    last_name: string;
    type: string;
}

interface Product {
    id: number;
    ref: string | null;
    label: string;
}

interface Entrepot {
    id: number;
    label: string;
    code: string;
    address: string | null;
    parent_id: number | null;
    assign_to: number | null;
    parent?: Entrepot | null;
    employee?: Employee | null;
    products?: Product[];
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedEntrepots {
    data: Entrepot[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLink[];
}

export default function Index({
    entrepots,
    parentEntrepots,
    employees,
    products,
    filters,
}: {
    entrepots: PaginatedEntrepots;
    parentEntrepots: Entrepot[];
    employees: Employee[];
    products: Product[];
    filters: { search?: string };
}) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Entrepot | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Entrepot | null>(null);
    const [searchQuery, setSearchQuery] = useState(filters.search || '');

    const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm({
        label: '',
        code: '',
        address: '',
        parent_id: '',
        assign_to: '',
    });

    const openCreate = () => {
        reset();
        clearErrors();
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const openEdit = (item: Entrepot) => {
        setData({
            label: item.label,
            code: item.code,
            address: item.address || '',
            parent_id: item.parent_id ? String(item.parent_id) : '',
            assign_to: item.assign_to ? String(item.assign_to) : '',
        });
        clearErrors();
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...data,
            parent_id: data.parent_id ? Number(data.parent_id) : null,
            assign_to: data.assign_to ? Number(data.assign_to) : null,
        };

        if (editingItem) {
            router.patch(route('entrepots.update', editingItem.id), payload, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        } else {
            router.post(route('entrepots.store'), payload, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('entrepots.index'), { search: searchQuery }, { preserveState: true });
    };

    const clearSearch = () => {
        setSearchQuery('');
        router.get(route('entrepots.index'), {}, { preserveState: true });
    };

    // Exclude self as parent warehouse option to avoid circular reference
    const availableParents = useMemo(() => {
        if (!editingItem) return parentEntrepots;
        return parentEntrepots.filter(e => e.id !== editingItem.id);
    }, [parentEntrepots, editingItem]);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 max-w-5xl mx-auto">
                    <div>
                        <div className="flex items-center space-x-2 text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                            <span>Stocks & Articles</span>
                            <span>/</span>
                            <span className="text-indigo-600 dark:text-indigo-400">Entrepôts</span>
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                            Gestion des Entrepôts
                            <span className="ml-2 text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-lg">
                                {entrepots.total}
                            </span>
                        </h2>
                    </div>
                    <button
                        onClick={openCreate}
                        className="inline-flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-widest rounded-2xl h-[42px] px-6 transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.97]"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Créer un entrepôt</span>
                    </button>
                </div>
            }
        >
            <Head title="Entrepôts" />

            <div className="max-w-5xl mx-auto space-y-6">
                
                {/* Search Bar */}
                <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl p-4 backdrop-blur-xl">
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-3 pl-10 pr-4 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all text-slate-700 dark:text-slate-200"
                                placeholder="Rechercher par libellé, code, adresse ou responsable..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={clearSearch}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                        <button
                            type="submit"
                            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold text-xs uppercase tracking-widest rounded-2xl h-[42px] px-6 transition-all"
                        >
                            Filtrer
                        </button>
                    </form>
                </div>

                {/* Main Table Card */}
                <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl overflow-hidden backdrop-blur-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/70 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800/50">
                                    <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest w-32">Code</th>
                                    <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Désignation</th>
                                    <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Adresse</th>
                                    <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Parent / Structure</th>
                                    <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Affecté à (Responsable)</th>
                                    <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest w-24">Articles</th>
                                    <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-right w-28">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/70 dark:divide-slate-800/70">
                                {entrepots.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-16 text-center text-xs text-slate-400">
                                            Aucun entrepôt trouvé. Cliquez sur "Créer un entrepôt".
                                        </td>
                                    </tr>
                                ) : (
                                    entrepots.data.map((item) => (
                                        <tr key={item.id} className="hover:bg-indigo-50/25 dark:hover:bg-indigo-950/5 group transition-all">
                                            <td className="py-3.5 px-6">
                                                <span className="font-mono text-[10px] font-extrabold px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg">
                                                    {item.code}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-6">
                                                <div className="font-bold text-slate-850 dark:text-white text-sm">{item.label}</div>
                                            </td>
                                            <td className="py-3.5 px-6 text-xs text-slate-450 dark:text-slate-400 max-w-xs truncate">
                                                {item.address || '—'}
                                            </td>
                                            <td className="py-3.5 px-6 text-xs text-slate-450 dark:text-slate-400">
                                                {item.parent ? (
                                                    <span className="inline-flex items-center space-x-1.5 text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-500/5 px-2 py-1 rounded-xl">
                                                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                        <span>{item.parent.label}</span>
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-350 dark:text-slate-600 font-medium">Entrepôt Principal</span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-6">
                                                {item.employee ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-slate-750 dark:text-slate-200">
                                                            {item.employee.last_name} {item.employee.first_name}
                                                        </span>
                                                        <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">
                                                            {item.employee.type}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-350 dark:text-slate-600 italic">Non assigné</span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-6">
                                                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 min-w-8">
                                                    {item.products ? item.products.length : 0}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-6 text-right">
                                                <div className="flex items-center justify-end space-x-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => openEdit(item)}
                                                        className="p-2 text-slate-450 hover:text-indigo-600 hover:bg-indigo-500/10 rounded-xl transition-all"
                                                        title="Modifier"
                                                    >
                                                        <svg className="h-4 w-4 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteTarget(item)}
                                                        className="p-2 text-slate-450 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-all"
                                                        title="Supprimer"
                                                    >
                                                        <svg className="h-4 w-4 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Layout (Metronic Style) */}
                    {entrepots.last_page > 1 && (
                        <div className="p-6 border-t border-slate-100/80 dark:border-slate-800/60 flex items-center justify-between flex-wrap gap-4 bg-slate-50/10 dark:bg-slate-950/5">
                            <span className="text-xs text-slate-450 dark:text-slate-450">
                                Affichage de <span className="font-extrabold text-slate-800 dark:text-slate-200">{(entrepots.current_page - 1) * entrepots.per_page + 1}</span> à <span className="font-extrabold text-slate-800 dark:text-slate-200">{Math.min(entrepots.current_page * entrepots.per_page, entrepots.total)}</span> sur <span className="font-extrabold text-slate-800 dark:text-slate-200">{entrepots.total}</span> entrepôts
                            </span>

                            <div className="flex items-center space-x-1.5">
                                {entrepots.links.map((link, idx) => {
                                    const isPrev = link.label.includes('Previous');
                                    const isNext = link.label.includes('Next');
                                    
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

                {/* Edit / Create Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-fade-in">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-[2.5rem] shadow-3xl p-6 lg:p-8 transform transition-all duration-350 max-h-[90vh] overflow-y-auto">
                            
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-4 mb-6">
                                <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-850 dark:text-white">
                                    {editingItem ? "Modifier l'Entrepôt" : "Nouvel Entrepôt"}
                                </h3>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-1.5 text-slate-400 hover:text-slate-650 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={submit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Code de l'entrepôt <span className="text-rose-500">*</span></label>
                                        <input
                                            className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-3 px-4 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all text-slate-800 dark:text-slate-200 font-mono font-bold"
                                            value={data.code}
                                            onChange={e => setData('code', e.target.value.toUpperCase())}
                                            placeholder="ex: WH-01"
                                            required
                                        />
                                        <InputError message={errors.code} className="mt-1" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Nom / Libellé <span className="text-rose-500">*</span></label>
                                        <input
                                            className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-3 px-4 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all text-slate-800 dark:text-slate-200"
                                            value={data.label}
                                            onChange={e => setData('label', e.target.value)}
                                            placeholder="ex: Entrepôt Nord"
                                            required
                                        />
                                        <InputError message={errors.label} className="mt-1" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Entrepôt Parent (Optionnel)</label>
                                    <select
                                        className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-3 px-4 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all text-slate-800 dark:text-slate-200"
                                        value={data.parent_id}
                                        onChange={e => setData('parent_id', e.target.value)}
                                    >
                                        <option value="">— Aucun (Entrepôt de premier niveau) —</option>
                                        {availableParents.map(parent => (
                                            <option key={parent.id} value={parent.id}>{parent.label} ({parent.code})</option>
                                        ))}
                                    </select>
                                    <InputError message={errors.parent_id} className="mt-1" />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Responsable Affecté <span className="text-slate-400 font-normal">(Employé)</span></label>
                                    <select
                                        className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-3 px-4 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all text-slate-800 dark:text-slate-200"
                                        value={data.assign_to}
                                        onChange={e => setData('assign_to', e.target.value)}
                                    >
                                        <option value="">— Aucun (Non assigné) —</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.last_name} {emp.first_name} ({emp.type})</option>
                                        ))}
                                    </select>
                                    <InputError message={errors.assign_to} className="mt-1" />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Adresse physique</label>
                                    <textarea
                                        rows={4}
                                        className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-3 px-4 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all resize-none text-slate-800 dark:text-slate-200"
                                        value={data.address}
                                        onChange={e => setData('address', e.target.value)}
                                        placeholder="ex: Zone Industrielle, Lot 45, Casablanca"
                                    />
                                    <InputError message={errors.address} className="mt-1" />
                                </div>

                                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-6 py-3 text-xs font-bold text-slate-650 dark:text-slate-350 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-750 transition-all"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-6 py-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl transition-all active:scale-[0.97] disabled:opacity-60 shadow-lg shadow-indigo-500/25"
                                    >
                                        {processing ? 'Enregistrement...' : 'Enregistrer'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {deleteTarget && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-fade-in">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-[2rem] shadow-3xl p-6">
                            <div className="flex items-center space-x-3 text-rose-500 mb-3">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-850 dark:text-white">
                                    Supprimer l'entrepôt ?
                                </h3>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed mb-6">
                                Êtes-vous sûr de vouloir supprimer l'entrepôt <strong>"{deleteTarget.label}"</strong> ({deleteTarget.code}) ? 
                                <span className="block mt-2 font-medium text-amber-600 dark:text-amber-400">
                                    Note: Les sous-entrepôts et l'affectation des employés associés seront automatiquement dissociés.
                                </span>
                            </p>
                            <div className="flex items-center justify-end space-x-3">
                                <button
                                    onClick={() => setDeleteTarget(null)}
                                    className="px-5 py-2.5 text-xs font-bold text-slate-650 dark:text-slate-350 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-750 transition-all"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={() => 
                                        router.delete(route('entrepots.destroy', deleteTarget.id), {
                                            onSuccess: () => setDeleteTarget(null),
                                        })
                                    }
                                    className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-2xl transition-all shadow-md shadow-rose-500/20 active:scale-[0.97]"
                                >
                                    Supprimer
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </AuthenticatedLayout>
    );
}
