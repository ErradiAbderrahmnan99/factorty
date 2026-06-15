import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';

interface Exercice {
    id: number;
    code: string;
}

interface PeriodeComptable {
    id: number;
    exercice_comptable_id: number;
    code: string;
    libelle: string;
    date_debut: string;
    date_fin: string;
    statut: 'ouvert' | 'cloture';
    exercice: Exercice;
}

interface PaginationLink { url: string | null; label: string; active: boolean; }

interface PaginatedPeriodes {
    data: PeriodeComptable[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLink[];
}

const STATUS_STYLING: Record<string, { badge: string; dot: string; label: string }> = {
    'ouvert': { badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-500', label: 'Ouvert' },
    'cloture': { badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border-rose-500/20', dot: 'bg-rose-500', label: 'Clôturé' },
};

export default function Index({ periodes, filters, exercices }: { periodes: PaginatedPeriodes; filters: { search: string | null }; exercices: Exercice[] }) {
    const { flash } = usePage().props as any;
    const [search, setSearch] = useState(filters.search || '');
    const [deleteTarget, setDeleteTarget] = useState<PeriodeComptable | null>(null);
    const [localFlash, setLocalFlash] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [selectedExerciceId, setSelectedExerciceId] = useState('');
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (flash?.success) {
            setLocalFlash({ type: 'success', message: flash.success });
            const t = setTimeout(() => setLocalFlash(null), 5000);
            return () => clearTimeout(t);
        } else if (flash?.error) {
            setLocalFlash({ type: 'error', message: flash.error });
            const t = setTimeout(() => setLocalFlash(null), 7000);
            return () => clearTimeout(t);
        }
    }, [flash]);

    useEffect(() => {
        if (isFirstRender.current) { isFirstRender.current = false; return; }
        const delay = setTimeout(() => {
            router.get(route('periodes-comptables.index'), { search: search || undefined }, { preserveState: true, replace: true });
        }, 300);
        return () => clearTimeout(delay);
    }, [search]);

    const handleGenerate = () => {
        if (!selectedExerciceId) return;
        router.post(route('periodes-comptables.generate'), { exercice_comptable_id: selectedExerciceId }, {
            onSuccess: () => {
                setShowGenerateModal(false);
                setSelectedExerciceId('');
            }
        });
    };

    return (
        <AuthenticatedLayout header={
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 max-w-7xl mx-auto">
                <div>
                    <div className="flex items-center space-x-2 text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        <span>Paramétrage</span><span>/</span>
                        <span className="text-indigo-600 dark:text-indigo-400">Périodes Comptables</span>
                    </div>
                    <div className="flex items-center mt-1.5 flex-wrap gap-3">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Périodes Comptables</h2>
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border-indigo-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                            <span>{periodes.total} au total</span>
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setShowGenerateModal(true)}
                        className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-3 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        <span>Générer</span>
                    </button>
                    <Link href={route('periodes-comptables.create')}
                        className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-3 rounded-2xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                        <span>Nouvelle Période</span>
                    </Link>
                </div>
            </div>
        }>
            <Head title="Périodes Comptables" />

            <div className="max-w-7xl mx-auto space-y-5">
                {/* Filters */}
                <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-5 backdrop-blur-xl flex flex-wrap gap-4 items-center">
                    <div className="relative flex-1 min-w-[200px]">
                        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input type="text" placeholder="Rechercher par code, libellé ou exercice..." value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition-all" />
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl overflow-hidden backdrop-blur-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100/80 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                                    <th className="py-4 px-6">Exercice</th>
                                    <th className="py-4 px-6">Code</th>
                                    <th className="py-4 px-6">Libellé</th>
                                    <th className="py-4 px-6">Date Début</th>
                                    <th className="py-4 px-6">Date Fin</th>
                                    <th className="py-4 px-6 text-center">Statut</th>
                                    <th className="py-4 px-6 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/30">
                                {periodes.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-xs font-semibold text-slate-400">
                                            Aucune période comptable trouvée.
                                        </td>
                                    </tr>
                                ) : periodes.data.map(item => {
                                    const styling = STATUS_STYLING[item.statut] || STATUS_STYLING.ouvert;
                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/5 transition-colors">
                                            <td className="py-4 px-6 text-xs font-bold text-slate-700 dark:text-slate-300">
                                                {item.exercice ? item.exercice.code : '—'}
                                            </td>
                                            <td className="py-4 px-6 text-xs font-black text-slate-800 dark:text-slate-200">{item.code}</td>
                                            <td className="py-4 px-6 text-xs font-semibold text-slate-700 dark:text-slate-300">{item.libelle}</td>
                                            <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400 font-medium">{item.date_debut}</td>
                                            <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400 font-medium">{item.date_fin}</td>
                                            <td className="py-4 px-6 text-center">
                                                <span className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border ${styling.badge}`}>
                                                    <span className={`h-1.5 w-1.5 rounded-full ${styling.dot}`} />
                                                    <span>{styling.label}</span>
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center justify-center space-x-1">
                                                    <Link href={route('periodes-comptables.edit', item.id)}
                                                        className="p-1.5 text-slate-455 hover:text-indigo-650 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all" title="Modifier">
                                                        <svg className="h-4 w-4 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                        </svg>
                                                    </Link>
                                                    <button onClick={() => setDeleteTarget(item)}
                                                        className="p-1.5 text-slate-455 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-all" title="Supprimer">
                                                        <svg className="h-4 w-4 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {periodes.last_page > 1 && (
                        <div className="p-6 border-t border-slate-100/80 dark:border-slate-800/60 flex items-center justify-between flex-wrap gap-4 bg-slate-50/10 dark:bg-slate-950/5">
                            <span className="text-xs text-slate-455 dark:text-slate-455">
                                Affichage de <span className="font-extrabold text-slate-800 dark:text-slate-200">{(periodes.current_page - 1) * periodes.per_page + 1}</span> à <span className="font-extrabold text-slate-800 dark:text-slate-200">{Math.min(periodes.current_page * periodes.per_page, periodes.total)}</span> sur <span className="font-extrabold text-slate-800 dark:text-slate-200">{periodes.total}</span> périodes
                            </span>
                            <div className="flex items-center space-x-1.5">
                                {periodes.links.map((link, idx) => {
                                    const isPrev = link.label.includes('Previous');
                                    const isNext = link.label.includes('Next');
                                    const renderLabel = () => {
                                        if (isPrev) return <svg className="h-3.5 w-3.5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
                                        if (isNext) return <svg className="h-3.5 w-3.5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>;
                                        return <span className="font-black text-xs">{link.label}</span>;
                                    };
                                    if (!link.url) return <span key={idx} className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-300 dark:text-slate-700 select-none cursor-not-allowed border border-transparent">{renderLabel()}</span>;
                                    return (
                                        <Link key={idx} href={link.url} preserveScroll
                                            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-150 active:scale-90 border ${link.active ? 'bg-indigo-600 text-white border-indigo-650 shadow-lg shadow-indigo-600/20' : 'bg-transparent text-slate-500 dark:text-slate-400 border-transparent hover:border-slate-200 dark:hover:border-slate-800 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'}`}>
                                            {renderLabel()}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Generate Modal */}
                {showGenerateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-fade-in">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-[2rem] shadow-3xl p-6">
                            <div className="flex items-center space-x-3 text-emerald-500 mb-4">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-850 dark:text-white">Générer les Périodes</h3>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-455 leading-relaxed mb-4">
                                Sélectionnez l'exercice comptable pour lequel vous souhaitez générer automatiquement les 12 périodes mensuelles.
                            </p>
                            
                            <div className="mb-6">
                                <select value={selectedExerciceId} onChange={e => setSelectedExerciceId(e.target.value)}
                                    className="w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50/40 dark:bg-slate-950/40 text-xs font-bold text-slate-850 dark:text-slate-200 py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all">
                                    <option value="">Sélectionnez un exercice...</option>
                                    {exercices.map(ex => (
                                        <option key={ex.id} value={ex.id}>{ex.code}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center justify-end space-x-3">
                                <button onClick={() => setShowGenerateModal(false)} className="px-5 py-2.5 text-xs font-bold text-slate-650 dark:text-slate-350 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-750 transition-all">Annuler</button>
                                <button onClick={handleGenerate} disabled={!selectedExerciceId}
                                    className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-2xl transition-all shadow-md shadow-emerald-500/20 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none">
                                    Générer
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Modal */}
                {deleteTarget && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-fade-in">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-[2rem] shadow-3xl p-6">
                            <div className="flex items-center space-x-3 text-rose-500 mb-3">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-850 dark:text-white">Supprimer la Période</h3>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-455 leading-relaxed mb-6">
                                Êtes-vous sûr de vouloir supprimer la période <strong>"{deleteTarget.code}"</strong> ? Cette action est irréversible.
                            </p>
                            <div className="flex items-center justify-end space-x-3">
                                <button onClick={() => setDeleteTarget(null)} className="px-5 py-2.5 text-xs font-bold text-slate-650 dark:text-slate-350 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-750 transition-all">Annuler</button>
                                <button onClick={() => { router.delete(route('periodes-comptables.destroy', deleteTarget.id), { onSuccess: () => setDeleteTarget(null) }); }}
                                    className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-2xl transition-all shadow-md shadow-rose-500/20 active:scale-[0.97]">
                                    Supprimer
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Toast */}
                {localFlash && (
                    <div className="fixed top-5 right-5 z-[100] max-w-sm w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[2rem] shadow-3xl p-4 animate-slide-in backdrop-blur-xl">
                        <div className="flex items-start space-x-3.5">
                            <div className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 ${localFlash.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border border-rose-500/20'}`}>
                                {localFlash.type === 'success' ? (
                                    <svg className="h-5 w-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                ) : (
                                    <svg className="h-5 w-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-850 dark:text-white">{localFlash.type === 'success' ? 'Succès' : 'Erreur'}</h4>
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-455 mt-1 leading-relaxed">{localFlash.message}</p>
                            </div>
                            <button onClick={() => setLocalFlash(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 transition-all shrink-0">
                                <svg className="h-4 w-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
