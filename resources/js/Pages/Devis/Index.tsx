import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';

interface Tier {
    id: number;
    label: string;
}

interface Devise {
    id: number;
    code: string;
    symbol: string | null;
}

interface Devis {
    id: number;
    ref: string;
    commercial: string | null;
    date_devis: string;
    duree_validite: number;
    status: 'brouillon' | 'envoyé' | 'accepté' | 'refusé';
    total_ht: number;
    total_tva: number;
    total_ttc: number;
    tier: Tier;
    devise: Devise;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedDevis {
    data: Devis[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLink[];
}

const STATUS_STYLING = {
    'brouillon': { badge: 'bg-slate-500/10 text-slate-650 dark:text-slate-400 border-slate-500/20', dot: 'bg-slate-500', label: 'Brouillon' },
    'envoyé':    { badge: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20', dot: 'bg-indigo-500', label: 'Envoyé' },
    'accepté':   { badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-500', label: 'Accepté' },
    'refusé':    { badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-450 border-rose-500/20', dot: 'bg-rose-500', label: 'Refusé' }
};

export default function Index({ devis, filters }: { devis: PaginatedDevis; filters: { search: string | null; status: string | null } }) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [deleteTarget, setDeleteTarget] = useState<Devis | null>(null);
    const [statusTarget, setStatusTarget] = useState<Devis | null>(null);
    const [importErrors, setImportErrors] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        const delayDebounce = setTimeout(() => {
            router.get(route('devis.index'), {
                search: search || undefined,
                status: statusFilter || undefined,
            }, { preserveState: true, replace: true });
        }, 300);
        return () => clearTimeout(delayDebounce);
    }, [search, statusFilter]);

    const changeStatus = (id: number, newStatus: string) => {
        router.post(route('devis.toggle-status', id), { status: newStatus }, {
            onSuccess: () => setStatusTarget(null),
            preserveScroll: true
        });
    };

    const handleExportTemplate = (e: React.MouseEvent) => {
        e.preventDefault();
        if (isExporting || isImporting) return;
        setIsExporting(true);
        window.location.href = route('devis.export-template');
        setTimeout(() => {
            setIsExporting(false);
        }, 3000);
    };

    const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        const formData = new FormData();
        formData.append('file', file);

        router.post(route('devis.import'), formData, {
            onError: (err) => {
                setImportErrors(Object.values(err).join('\n') || "Erreur lors de l'importation de l'Excel");
            },
            onFinish: () => {
                setIsImporting(false);
                e.target.value = '';
            }
        });
    };

    return (
        <AuthenticatedLayout header={
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 max-w-7xl mx-auto">
                <div>
                    <div className="flex items-center space-x-2 text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        <span>Ventes</span><span>/</span>
                        <span className="text-indigo-600 dark:text-indigo-400">Devis</span>
                    </div>
                    <div className="flex items-center mt-1.5 flex-wrap gap-3">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Devis / Estimations</h2>
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border-indigo-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                            <span>{devis.total} au total</span>
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
                    <button onClick={handleExportTemplate} disabled={isExporting || isImporting}
                        className={`inline-flex items-center justify-center space-x-2 bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-widest rounded-2xl h-[42px] px-5 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/35 transition-all select-none ${
                            (isExporting || isImporting) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                        }`}>
                        {isExporting ? (
                            <svg className="animate-spin h-4 w-4 text-emerald-600 dark:text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg className="h-4 w-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        )}
                        <span>{isExporting ? 'Génération...' : 'Modèle Excel'}</span>
                    </button>
                    
                    <label className={`inline-flex items-center justify-center space-x-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-750 text-slate-650 dark:text-slate-350 font-bold text-xs uppercase tracking-widest rounded-2xl h-[42px] px-5 hover:bg-slate-200 dark:hover:bg-slate-700/80 transition-all select-none ${
                        (isExporting || isImporting) ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'
                    }`}>
                        {isImporting ? (
                            <svg className="animate-spin h-4 w-4 text-slate-650 dark:text-slate-350" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg className="h-4 w-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        )}
                        <span>{isImporting ? 'Importation...' : 'Importer Excel'}</span>
                        <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImportExcel} disabled={isExporting || isImporting} />
                    </label>

                    <Link href={route('devis.create')}
                        className="inline-flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-widest rounded-2xl h-[42px] px-6 shadow-lg shadow-indigo-500/20 active:scale-[0.97] transition-all shrink-0">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                        <span>Nouveau Devis</span>
                    </Link>
                </div>
            </div>
        }>
            <Head title="Devis" />
            <div className="max-w-7xl mx-auto space-y-5">
                
                {/* Filters */}
                <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl p-5 backdrop-blur-xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </span>
                            <input type="text" className="pl-11 pr-4 py-3 w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                                value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par référence, tiers, commercial..." />
                        </div>
                        <select className="py-3 px-4 w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl text-xs focus:outline-none focus:border-indigo-500 transition-all"
                            value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                            <option value="">Tous les statuts</option>
                            <option value="brouillon">Brouillon</option>
                            <option value="envoyé">Envoyé</option>
                            <option value="accepté">Accepté</option>
                            <option value="refusé">Refusé</option>
                        </select>
                    </div>
                </div>

                {/* Datatable */}
                <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl overflow-hidden backdrop-blur-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800/50">
                                    <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest w-40">Référence</th>
                                    <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Tiers</th>
                                    <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest w-36">Date</th>
                                    <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest w-32">Validité</th>
                                    <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-right w-44">Total TTC</th>
                                    <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-center w-36">Statut</th>
                                    <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-center w-28">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/70 dark:divide-slate-800/70">
                                {devis.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-20 text-center">
                                            <div className="flex flex-col items-center space-y-3">
                                                <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-slate-900/60 flex items-center justify-center border border-slate-100 dark:border-slate-800">
                                                    <svg className="h-6 w-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                </div>
                                                <div>
                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Aucun devis trouvé</span>
                                                    <span className="text-[10px] text-slate-400 mt-1 block font-medium">Créer un nouveau devis pour commencer.</span>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : devis.data.map(item => {
                                    const st = STATUS_STYLING[item.status] || STATUS_STYLING['brouillon'];
                                    return (
                                        <tr key={item.id} className="hover:bg-indigo-50/20 dark:hover:bg-indigo-950/5 transition-all group">
                                            <td className="py-4 px-6 font-mono text-xs font-black text-indigo-600 dark:text-indigo-400">
                                                {item.ref}
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="text-xs font-extrabold text-slate-800 dark:text-slate-100">{item.tier.label}</div>
                                                {item.commercial && <div className="text-[10px] text-slate-400 font-medium">Com : {item.commercial}</div>}
                                            </td>
                                            <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                                                {item.date_devis}
                                            </td>
                                            <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400">
                                                {item.duree_validite} jours
                                            </td>
                                            <td className="py-4 px-6 text-right font-mono text-xs font-black text-slate-800 dark:text-slate-100">
                                                {item.total_ttc.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[9px] text-slate-400">{item.devise.symbol || item.devise.code}</span>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <button onClick={() => setStatusTarget(item)}
                                                    className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider transition-all cursor-pointer active:scale-95 border ${st.badge}`}>
                                                    <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                                                    <span>{st.label}</span>
                                                    <svg className="h-2.5 w-2.5 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                                                </button>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <div className="flex items-center justify-center space-x-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                    <Link href={route('devis.edit', item.id)}
                                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-500/10 rounded-xl transition-all">
                                                        <svg className="h-4 w-4 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                    </Link>
                                                    <button onClick={() => setDeleteTarget(item)}
                                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-all">
                                                        <svg className="h-4 w-4 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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
                    {devis.last_page > 1 && (
                        <div className="p-6 border-t border-slate-100/80 dark:border-slate-800/60 flex items-center justify-between flex-wrap gap-4">
                            <span className="text-xs text-slate-450 dark:text-slate-400">
                                Affichage de <strong>{(devis.current_page - 1) * devis.per_page + 1}</strong> à <strong>{Math.min(devis.current_page * devis.per_page, devis.total)}</strong> sur <strong>{devis.total}</strong> devis
                            </span>
                            <div className="flex items-center space-x-1.5">
                                {devis.links.map((link, idx) => {
                                    const isPrev = link.label.includes('Previous');
                                    const isNext = link.label.includes('Next');
                                    const renderLabel = () => isPrev
                                        ? <svg className="h-3.5 w-3.5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                                        : isNext
                                        ? <svg className="h-3.5 w-3.5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                        : <span className="font-black text-xs">{link.label}</span>;
                                    if (!link.url) return <span key={idx} className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-300 cursor-not-allowed">{renderLabel()}</span>;
                                    return (
                                        <Link key={idx} href={link.url} preserveScroll
                                            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-150 active:scale-90 border ${
                                                link.active
                                                    ? 'bg-indigo-600 text-white border-indigo-650 shadow-lg shadow-indigo-600/20'
                                                    : 'bg-transparent text-slate-500 border-transparent hover:border-slate-200 dark:hover:border-slate-800 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
                                            }`}>{renderLabel()}</Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Change Status Modal */}
            {statusTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-md p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-3xl shadow-2xl p-6">
                        <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-850 dark:text-white mb-4">Changer le statut</h3>
                        <p className="text-xs text-slate-500 mb-5">Modifier le statut du devis <strong className="text-slate-800 dark:text-slate-200">"{statusTarget.ref}"</strong> :</p>
                        <div className="space-y-2">
                            {['brouillon', 'envoyé', 'accepté', 'refusé'].map(statusOption => {
                                const st = STATUS_STYLING[statusOption as keyof typeof STATUS_STYLING];
                                return (
                                    <button key={statusOption} onClick={() => changeStatus(statusTarget.id, statusOption)}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border text-xs font-extrabold uppercase tracking-wider transition-all hover:bg-slate-50 dark:hover:bg-slate-850 ${
                                            statusTarget.status === statusOption ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20' : 'border-slate-200 dark:border-slate-800'
                                        }`}>
                                        <div className="flex items-center space-x-2">
                                            <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                                            <span>{st.label}</span>
                                        </div>
                                        {statusTarget.status === statusOption && (
                                            <svg className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="flex items-center justify-end pt-5">
                            <button onClick={() => setStatusTarget(null)} className="px-5 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-all">Annuler</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-md p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-3xl shadow-2xl p-6">
                        <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-850 dark:text-white mb-2">Supprimer ?</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                            Supprimer le devis <strong className="text-slate-800 dark:text-slate-100">"{deleteTarget.ref}"</strong> ? Cette action est irréversible.
                        </p>
                        <div className="flex items-center justify-end space-x-3">
                            <button onClick={() => setDeleteTarget(null)} className="px-5 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-all">Annuler</button>
                            <button onClick={() => router.delete(route('devis.destroy', deleteTarget.id), { onSuccess: () => setDeleteTarget(null) })}
                                className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-2xl transition-all active:scale-[0.97]">Supprimer</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Excel Import Errors Modal */}
            {importErrors && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-md p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl p-6 relative overflow-hidden">
                        {/* Upper Toast-Like row resembling user screenshot */}
                        <div className="flex items-start space-x-4">
                            <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center shrink-0 text-indigo-650 dark:text-indigo-400">
                                <svg className="h-6 w-6 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-black text-slate-900 dark:text-white leading-snug">
                                    Erreur de validation du fichier Excel
                                </h3>
                                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                    Des informations obligatoires ou invalides ont été détectées. Veuillez corriger le fichier Excel et réessayer.
                                </p>
                            </div>
                            <button onClick={() => setImportErrors(null)}
                                className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-650 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shrink-0">
                                <svg className="h-4 w-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Error lines lists scroll container */}
                        <div className="mt-5 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                            <div className="max-h-[320px] overflow-y-auto space-y-2.5 pr-1.5 custom-scrollbar">
                                {importErrors.split('\n').map((line, idx) => {
                                    const cleanLine = line.replace(/^[•\-\s*]+/, '').trim();
                                    if (!cleanLine || cleanLine.startsWith("Erreurs de validation")) return null;
                                    return (
                                        <div key={idx} className="flex items-start space-x-2.5 p-3 rounded-2xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/10 dark:border-rose-500/20 text-xs font-semibold text-rose-700 dark:text-rose-400">
                                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0 animate-pulse" />
                                            <span className="leading-relaxed">{cleanLine}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Footer action button */}
                        <div className="flex justify-end mt-5">
                            <button onClick={() => setImportErrors(null)}
                                className="px-5 py-2.5 text-xs font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-350 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 rounded-2xl transition-all">
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
