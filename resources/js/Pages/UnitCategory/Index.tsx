import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm, router } from '@inertiajs/react';
import { FormEventHandler, useState, useEffect } from 'react';

interface UnitCategory {
    id: number;
    code: string | null;
    label: string;
    description: string | null;
}

export default function Index({
    unitCategories,
    filters,
}: {
    unitCategories: UnitCategory[];
    filters: { search: string | null };
}) {
    const [search, setSearch] = useState(filters.search || '');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<UnitCategory | null>(null);
    const [deletingCategory, setDeletingCategory] = useState<UnitCategory | null>(null);

    // Form setup
    const { data, setData, post, patch, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        label: '',
        code: '',
        description: '',
    });

    // Real-time search debouncing
    useEffect(() => {
        const timeOutId = setTimeout(() => {
            router.get(
                route('unit-categories.index'),
                { search: search || undefined },
                { preserveState: true, replace: true }
            );
        }, 300);
        return () => clearTimeout(timeOutId);
    }, [search]);

    const openCreateModal = () => {
        setEditingCategory(null);
        reset();
        clearErrors();
        setIsFormOpen(true);
    };

    const openEditModal = (category: UnitCategory) => {
        setEditingCategory(category);
        clearErrors();
        setData({
            label: category.label,
            code: category.code || '',
            description: category.description || '',
        });
        setIsFormOpen(true);
    };

    const openDeleteModal = (category: UnitCategory) => {
        setDeletingCategory(category);
        setIsDeleteOpen(true);
    };

    const submitForm: FormEventHandler = (e) => {
        e.preventDefault();

        if (editingCategory) {
            patch(route('unit-categories.update', editingCategory.id), {
                onSuccess: () => {
                    setIsFormOpen(false);
                    reset();
                },
            });
        } else {
            post(route('unit-categories.store'), {
                onSuccess: () => {
                    setIsFormOpen(false);
                    reset();
                },
            });
        }
    };

    const submitDelete = (e: React.FormEvent) => {
        e.preventDefault();
        if (deletingCategory) {
            destroy(route('unit-categories.destroy', deletingCategory.id), {
                onSuccess: () => {
                    setIsDeleteOpen(false);
                    setDeletingCategory(null);
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
                            <span className="text-indigo-600 dark:text-indigo-400">Catégories d'Unité</span>
                        </div>
                        <div className="flex items-center mt-1.5 flex-wrap">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight inline-block">
                                Catégories d'Unité
                            </h2>
                            <span className="text-slate-350 dark:text-slate-600 font-bold select-none text-sm inline-block leading-none" style={{ marginLeft: '12px', marginRight: '12px' }}>•</span>
                            <span 
                                className="inline-block px-2.5 py-1 text-[10px] font-extrabold bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 rounded-lg uppercase tracking-wider"
                            >
                                {unitCategories.length} au total
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={openCreateModal}
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
                        <span>Nouvelle Catégorie</span>
                    </button>
                </div>
            }
        >
            <Head title="Catégories d'Unité" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Modern Floating Card */}
                <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-none rounded-3xl overflow-hidden backdrop-blur-xl transition-all duration-300">
                    
                    {/* Search Field Area */}
                    <div className="p-6 pb-5 border-b border-slate-100 dark:border-slate-800/40 flex items-center justify-between">
                        <div className="relative w-full max-w-sm">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <TextInput
                                type="text"
                                className="pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-800/80 rounded-2xl text-xs placeholder-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all duration-300"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Rechercher par libellé, code..."
                            />
                        </div>
                    </div>

                    {/* Datatable */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800/50">
                                    <th className="py-4.5 px-6 text-[10px] font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-widest w-1/4">Code</th>
                                    <th className="py-4.5 px-6 text-[10px] font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-widest w-1/3">Nom / Libellé</th>
                                    <th className="py-4.5 px-6 text-[10px] font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-widest">Description</th>
                                    <th className="py-4.5 px-6 text-[10px] font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-widest text-center w-32">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/70 dark:divide-slate-800/70 bg-white dark:bg-transparent">
                                {unitCategories.length > 0 ? (
                                    unitCategories.map((category) => (
                                        <tr key={category.id} className="hover:bg-indigo-50/20 dark:hover:bg-indigo-950/5 transition-all duration-200 group">
                                            <td className="py-4 px-6 whitespace-nowrap">
                                                {category.code ? (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/50 dark:border-slate-700/50 font-mono text-[10px] font-extrabold tracking-wider">
                                                        {category.code}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300 dark:text-slate-700 font-mono text-xs">—</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 whitespace-nowrap text-xs font-extrabold text-slate-850 dark:text-slate-100">
                                                {category.label}
                                            </td>
                                            <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400 max-w-sm truncate">
                                                {category.description || <span className="text-slate-300 dark:text-slate-700 font-mono">—</span>}
                                            </td>
                                            <td className="py-4 px-6 whitespace-nowrap text-center">
                                                <div className="flex items-center justify-center space-x-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => openEditModal(category)}
                                                        className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-all duration-250"
                                                        title="Modifier"
                                                    >
                                                        <svg className="h-4 w-4 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => openDeleteModal(category)}
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
                                        <td colSpan={4} className="py-20 text-center text-slate-450 dark:text-slate-500">
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-slate-900/60 flex items-center justify-center border border-slate-100 dark:border-slate-800">
                                                    <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Aucune catégorie d'unité trouvée</span>
                                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">Cliquez sur "Nouvelle Catégorie" pour en créer une.</span>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* CREATE / EDIT MODAL */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-md p-4">
                    <div 
                        className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/80 w-full rounded-3xl shadow-2xl p-6 overflow-hidden transform transition-all duration-300 animate-fade-in"
                        style={{ maxWidth: '440px' }}
                    >
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/60 mb-5">
                            <h3 className="text-sm font-extrabold text-slate-850 dark:text-white uppercase tracking-widest">
                                {editingCategory ? `Modifier la Catégorie` : `Créer une Catégorie`}
                            </h3>
                            <button
                                onClick={() => setIsFormOpen(false)}
                                className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-350 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 transition-all duration-200"
                            >
                                <svg className="h-4.5 w-4.5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={submitForm} className="space-y-4">
                            <div>
                                <InputLabel htmlFor="form_code" value="Code Catégorie" />
                                <TextInput
                                    id="form_code"
                                    className="mt-1.5 py-3 px-4 bg-slate-50 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-800/80 rounded-2xl text-xs focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all duration-300"
                                    value={data.code}
                                    onChange={(e) => setData('code', e.target.value)}
                                    placeholder="ex: UNIT-MASS"
                                />
                                <InputError className="mt-2" message={errors.code} />
                            </div>

                            <div>
                                <InputLabel htmlFor="form_label" value="Nom / Libellé" />
                                <TextInput
                                    id="form_label"
                                    className="mt-1.5 py-3 px-4 bg-slate-50 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-800/80 rounded-2xl text-xs focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all duration-300"
                                    value={data.label}
                                    onChange={(e) => setData('label', e.target.value)}
                                    placeholder="ex: Masse, Longueur..."
                                    required
                                />
                                <InputError className="mt-2" message={errors.label} />
                            </div>

                            <div>
                                <InputLabel htmlFor="form_desc" value="Description" />
                                <textarea
                                    id="form_desc"
                                    className="mt-1.5 block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs text-slate-800 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-950 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all duration-350 p-4.5 min-h-[100px]"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Description de la catégorie d'unité..."
                                />
                                <InputError className="mt-2" message={errors.description} />
                            </div>

                            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-6">
                                <button type="button" onClick={() => setIsFormOpen(false)} className="px-5 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-750 transition-all">Annuler</button>
                                <button type="submit" disabled={processing} className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl transition-all active:scale-[0.97] disabled:opacity-60">{processing ? 'Enregistrement...' : 'Enregistrer'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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
                            Êtes-vous sûr de vouloir supprimer la catégorie <span className="font-bold text-slate-800 dark:text-slate-100">"{deletingCategory?.label}"</span> ? 
                            Cette action supprimera également toutes les unités qui lui sont rattachées. Cette action est définitive.
                        </p>

                        <form onSubmit={submitDelete} className="flex items-center justify-end space-x-3">
                            <button type="button" onClick={() => setIsDeleteOpen(false)} className="px-5 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-750 transition-all">Annuler</button>
                            <button
                                type="submit"
                                className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-2xl transition-all active:scale-[0.97]"
                                disabled={processing}
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
