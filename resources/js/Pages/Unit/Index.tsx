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
}

interface Unit {
    id: number;
    unit_category_id: number;
    code: string | null;
    label: string;
    ratio: number;
    unit_category?: UnitCategory;
}

export default function Index({
    units,
    unitCategories,
    filters,
}: {
    units: Unit[];
    unitCategories: UnitCategory[];
    filters: { search: string | null };
}) {
    const [search, setSearch] = useState(filters.search || '');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
    const [deletingUnit, setDeletingUnit] = useState<Unit | null>(null);

    // Form setup
    const { data, setData, post, patch, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        unit_category_id: '',
        label: '',
        code: '',
        ratio: '1.000000',
    });

    // Real-time search debouncing
    useEffect(() => {
        const timeOutId = setTimeout(() => {
            router.get(
                route('units.index'),
                { search: search || undefined },
                { preserveState: true, replace: true }
            );
        }, 300);
        return () => clearTimeout(timeOutId);
    }, [search]);

    const openCreateModal = () => {
        setEditingUnit(null);
        reset();
        clearErrors();
        // Pre-select first category if available
        if (unitCategories.length > 0) {
            setData('unit_category_id', String(unitCategories[0].id));
        }
        setIsFormOpen(true);
    };

    const openEditModal = (unit: Unit) => {
        setEditingUnit(unit);
        clearErrors();
        setData({
            unit_category_id: String(unit.unit_category_id),
            label: unit.label,
            code: unit.code || '',
            ratio: String(unit.ratio),
        });
        setIsFormOpen(true);
    };

    const openDeleteModal = (unit: Unit) => {
        setDeletingUnit(unit);
        setIsDeleteOpen(true);
    };

    const submitForm: FormEventHandler = (e) => {
        e.preventDefault();

        if (editingUnit) {
            patch(route('units.update', editingUnit.id), {
                onSuccess: () => {
                    setIsFormOpen(false);
                    reset();
                },
            });
        } else {
            post(route('units.store'), {
                onSuccess: () => {
                    setIsFormOpen(false);
                    reset();
                },
            });
        }
    };

    const submitDelete = (e: React.FormEvent) => {
        e.preventDefault();
        if (deletingUnit) {
            destroy(route('units.destroy', deletingUnit.id), {
                onSuccess: () => {
                    setIsDeleteOpen(false);
                    setDeletingUnit(null);
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
                            <span className="text-indigo-600 dark:text-indigo-400">Unités</span>
                        </div>
                        <div className="flex items-center mt-1.5 flex-wrap">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight inline-block">
                                Unités
                            </h2>
                            <span className="text-slate-350 dark:text-slate-600 font-bold select-none text-sm inline-block leading-none" style={{ marginLeft: '12px', marginRight: '12px' }}>•</span>
                            <span 
                                className="inline-block px-2.5 py-1 text-[10px] font-extrabold bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 rounded-lg uppercase tracking-wider"
                            >
                                {units.length} au total
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
                        <span>Nouvelle Unité</span>
                    </button>
                </div>
            }
        >
            <Head title="Unités" />

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
                                placeholder="Rechercher par unité, code, catégorie..."
                            />
                        </div>
                    </div>

                    {/* Datatable */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800/50">
                                    <th className="py-4.5 px-6 text-[10px] font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-widest w-1/4">Code</th>
                                    <th className="py-4.5 px-6 text-[10px] font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-widest w-1/4">Nom / Libellé</th>
                                    <th className="py-4.5 px-6 text-[10px] font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-widest w-1/4">Catégorie</th>
                                    <th className="py-4.5 px-6 text-[10px] font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-widest">Ratio / Équivalence</th>
                                    <th className="py-4.5 px-6 text-[10px] font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-widest text-center w-32">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/70 dark:divide-slate-800/70 bg-white dark:bg-transparent">
                                {units.length > 0 ? (
                                    units.map((unit) => (
                                        <tr key={unit.id} className="hover:bg-indigo-50/20 dark:hover:bg-indigo-950/5 transition-all duration-200 group">
                                            <td className="py-4 px-6 whitespace-nowrap">
                                                {unit.code ? (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/50 dark:border-slate-700/50 font-mono text-[10px] font-extrabold tracking-wider">
                                                        {unit.code}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300 dark:text-slate-700 font-mono text-xs">—</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 whitespace-nowrap text-xs font-extrabold text-slate-850 dark:text-slate-100">
                                                {unit.label}
                                            </td>
                                            <td className="py-4 px-6 whitespace-nowrap text-xs font-semibold text-slate-650 dark:text-slate-300">
                                                {unit.unit_category?.label || <span className="text-rose-500 dark:text-rose-450 font-bold">Non défini</span>}
                                            </td>
                                            <td className="py-4 px-6 whitespace-nowrap text-xs text-slate-800 dark:text-slate-100">
                                                <span className="font-extrabold text-slate-850 dark:text-slate-100">
                                                    {Number(unit.ratio).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 6 })}
                                                </span>
                                                <span className="text-slate-300 dark:text-slate-600 font-normal select-none text-[10px]" style={{ margin: '0 8px' }}>•</span>
                                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                                                    1 base = {Number(unit.ratio)} {unit.label}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 whitespace-nowrap text-center">
                                                <div className="flex items-center justify-center space-x-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => openEditModal(unit)}
                                                        className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-all duration-250"
                                                        title="Modifier"
                                                    >
                                                        <svg className="h-4 w-4 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => openDeleteModal(unit)}
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
                                        <td colSpan={5} className="py-20 text-center text-slate-450 dark:text-slate-500">
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-slate-900/60 flex items-center justify-center border border-slate-100 dark:border-slate-800">
                                                    <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Aucune unité de mesure trouvée</span>
                                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">Cliquez sur "Nouvelle Unité" pour commencer à en ajouter.</span>
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
                                {editingUnit ? `Modifier l'Unité` : `Créer une Unité`}
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

                        {unitCategories.length === 0 ? (
                            <div className="py-6 text-center space-y-4">
                                <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed">
                                    Vous devez d'abord créer au moins une <span className="font-extrabold text-indigo-600">Catégorie d'Unité</span> avant de pouvoir ajouter une Unité.
                                </p>
                                <button
                                    onClick={() => {
                                        setIsFormOpen(false);
                                        router.get(route('unit-categories.index'));
                                    }}
                                    className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-750 rounded-xl transition-all"
                                >
                                    Aller aux Catégories
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={submitForm} className="space-y-4">
                                <div>
                                    <InputLabel htmlFor="form_category" value="Catégorie d'Unité" />
                                    <select
                                        id="form_category"
                                        className="mt-1.5 block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs text-slate-800 dark:text-slate-350 focus:outline-none focus:bg-white dark:focus:bg-slate-950 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all duration-300 py-3 px-4"
                                        value={data.unit_category_id}
                                        onChange={(e) => setData('unit_category_id', e.target.value)}
                                        required
                                    >
                                        <option value="" className="text-slate-400">Choisir une catégorie...</option>
                                        {unitCategories.map((cat) => (
                                            <option key={cat.id} value={cat.id} className="text-slate-800 dark:text-white bg-white dark:bg-slate-900">
                                                {cat.label}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError className="mt-2" message={errors.unit_category_id} />
                                </div>

                                <div>
                                    <InputLabel htmlFor="form_code" value="Code Unité" />
                                    <TextInput
                                        id="form_code"
                                        className="mt-1.5 py-3 px-4 bg-slate-50 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-800/80 rounded-2xl text-xs focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all duration-300"
                                        value={data.code}
                                        onChange={(e) => setData('code', e.target.value)}
                                        placeholder="ex: KG, M, L"
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
                                        placeholder="ex: Kilogramme, Mètre, Litre"
                                        required
                                    />
                                    <InputError className="mt-2" message={errors.label} />
                                </div>

                                <div>
                                    <InputLabel htmlFor="form_ratio" value="Ratio d'équivalence" />
                                    <TextInput
                                        id="form_ratio"
                                        type="number"
                                        step="0.000001"
                                        className="mt-1.5 py-3 px-4 bg-slate-50 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-800/80 rounded-2xl text-xs focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all duration-300 font-mono"
                                        value={data.ratio}
                                        onChange={(e) => setData('ratio', e.target.value)}
                                        placeholder="ex: 1.000000, 1000.000000, 0.001000"
                                        required
                                    />
                                    <span className="text-[9px] text-slate-400 mt-1 block leading-normal">
                                        Exemple : si l'unité de base est le Mètre (ratio = 1), le Millimètre a un ratio de 0.001 et le Kilomètre a un ratio de 1000.
                                    </span>
                                    <InputError className="mt-2" message={errors.ratio} />
                                </div>

                                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-6">
                                    <button type="button" onClick={() => setIsFormOpen(false)} className="px-5 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-750 transition-all">Annuler</button>
                                    <button type="submit" disabled={processing} className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl transition-all active:scale-[0.97] disabled:opacity-60">{processing ? 'Enregistrement...' : 'Enregistrer'}</button>
                                </div>
                            </form>
                        )}
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
                            Êtes-vous sûr de vouloir supprimer l'unité <span className="font-bold text-slate-800 dark:text-slate-100">"{deletingUnit?.label}"</span> ? Cette action est définitive.
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
