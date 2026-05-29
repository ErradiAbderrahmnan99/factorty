import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';

interface TierCategory { id: number; label: string; }
interface City { id: number; label: string; }
interface Country { id: number; label: string; }

interface Tier {
    id: number;
    type: 'prospect' | 'client' | 'fournisseur';
    ref: string | null;
    label: string;
    is_professionnel: boolean;
    email: string | null;
    telephone: string | null;
    status: 'actif' | 'inactif';
    tier_category?: TierCategory;
    city?: City;
    country?: Country;
}

interface PaginationLink { url: string | null; label: string; active: boolean; }
interface Paginated {
    data: Tier[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLink[];
}

const TYPE_COLORS = {
    prospect:    { badge: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20', dot: 'bg-violet-500' },
    client:      { badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-500' },
    fournisseur: { badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', dot: 'bg-amber-500' },
};

export default function Index({
    tiers, type, typeLabel, tierCategories, filters,
}: {
    tiers: Paginated;
    type: string;
    typeLabel: string;
    tierCategories: TierCategory[];
    filters: { search: string | null; status: string | null; catId: string | null };
}) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [catFilter, setCatFilter] = useState(filters.catId || '');
    const [deleteTarget, setDeleteTarget] = useState<Tier | null>(null);
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) { isFirstRender.current = false; return; }
        const t = setTimeout(() => {
            router.get(route(`tiers.${type}.index`), {
                search: search || undefined,
                status: statusFilter || undefined,
                tier_category_id: catFilter || undefined,
            }, { preserveState: true, replace: true });
        }, 300);
        return () => clearTimeout(t);
    }, [search, statusFilter, catFilter]);

    const toggleStatus = (tier: Tier) => {
        router.post(route(`tiers.${type}.toggle-status`, tier.id), {}, { preserveScroll: true });
    };

    const tc = TYPE_COLORS[type as keyof typeof TYPE_COLORS] || TYPE_COLORS.prospect;

    return (
        <AuthenticatedLayout header={
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 max-w-7xl mx-auto">
                <div>
                    <div className="flex items-center space-x-2 text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        <span>Données de base</span><span>/</span><span>Tiers</span><span>/</span>
                        <span className="text-indigo-600 dark:text-indigo-400">{typeLabel}s</span>
                    </div>
                    <div className="flex items-center mt-1.5 flex-wrap gap-3">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{typeLabel}s</h2>
                        <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border ${tc.badge}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${tc.dot}`} />
                            <span>{tiers.total} au total</span>
                        </span>
                    </div>
                </div>
                <Link href={route(`tiers.${type}.create`)}
                    className="inline-flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-widest rounded-2xl h-[42px] px-6 shadow-lg shadow-indigo-500/20 active:scale-[0.97] transition-all shrink-0">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                    <span>Nouveau {typeLabel}</span>
                </Link>
            </div>
        }>
            <Head title={`${typeLabel}s`} />
            <div className="max-w-7xl mx-auto space-y-5">

                {/* Filters */}
                <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl p-5 backdrop-blur-xl">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </span>
                            <input type="text" className="pl-11 pr-4 py-3 w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                                value={search} onChange={e => setSearch(e.target.value)} placeholder={`Rechercher un ${typeLabel.toLowerCase()}...`} />
                        </div>
                        <select className="py-3 px-4 w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl text-xs focus:outline-none focus:border-indigo-500 transition-all"
                            value={catFilter} onChange={e => setCatFilter(e.target.value)}>
                            <option value="">Toutes les catégories</option>
                            {tierCategories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                        </select>
                        <select className="py-3 px-4 w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl text-xs focus:outline-none focus:border-indigo-500 transition-all"
                            value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                            <option value="">Tous les statuts</option>
                            <option value="actif">Actif</option>
                            <option value="inactif">Inactif</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl overflow-hidden backdrop-blur-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800/50">
                                    <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Réf / Nom</th>
                                    <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Catégorie</th>
                                    <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Localisation</th>
                                    <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Contact</th>
                                    <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-center w-28">Statut</th>
                                    <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-center w-28">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/70 dark:divide-slate-800/70">
                                {tiers.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center">
                                            <div className="flex flex-col items-center space-y-3">
                                                <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-slate-900/60 flex items-center justify-center border border-slate-100 dark:border-slate-800">
                                                    <svg className="h-6 w-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                </div>
                                                <div>
                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Aucun {typeLabel.toLowerCase()} trouvé</span>
                                                    <span className="text-[10px] text-slate-400 mt-1 block">Cliquez sur "Nouveau {typeLabel}" pour créer votre premier enregistrement.</span>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : tiers.data.map(tier => (
                                    <tr key={tier.id} className="hover:bg-indigo-50/20 dark:hover:bg-indigo-950/5 transition-all group">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center space-x-3">
                                                <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-xs font-black uppercase border ${tc.badge} shrink-0`}>
                                                    {tier.label.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="text-xs font-extrabold text-slate-850 dark:text-slate-100">{tier.label}</div>
                                                    <div className="flex items-center space-x-2 mt-0.5">
                                                        {tier.ref && <span className="font-mono text-[9px] text-slate-400">{tier.ref}</span>}
                                                        {tier.is_professionnel && (
                                                            <span className="text-[8px] font-extrabold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded uppercase tracking-wider">Pro</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400">
                                            {tier.tier_category?.label || <span className="text-slate-300 dark:text-slate-700">—</span>}
                                        </td>
                                        <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400">
                                            {tier.city?.label ? (
                                                <span>{tier.city.label}{tier.country?.label && `, ${tier.country.label}`}</span>
                                            ) : (
                                                <span className="text-slate-300 dark:text-slate-700">—</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="space-y-0.5">
                                                {tier.email && <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center space-x-1"><svg className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg><span>{tier.email}</span></div>}
                                                {tier.telephone && <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center space-x-1"><svg className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg><span>{tier.telephone}</span></div>}
                                                {!tier.email && !tier.telephone && <span className="text-slate-300 dark:text-slate-700 text-xs">—</span>}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <button onClick={() => toggleStatus(tier)}
                                                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider transition-all cursor-pointer active:scale-95 border ${
                                                    tier.status === 'actif'
                                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200/50 dark:border-slate-700/50'
                                                }`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${tier.status === 'actif' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                                <span>{tier.status}</span>
                                            </button>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <div className="flex items-center justify-center space-x-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <Link href={route(`tiers.${type}.edit`, tier.id)}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-500/10 rounded-xl transition-all">
                                                    <svg className="h-4 w-4 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                </Link>
                                                <button onClick={() => setDeleteTarget(tier)}
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-all">
                                                    <svg className="h-4 w-4 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {tiers.last_page > 1 && (
                        <div className="p-6 border-t border-slate-100/80 dark:border-slate-800/60 flex items-center justify-between flex-wrap gap-4">
                            <span className="text-xs text-slate-450 dark:text-slate-450">
                                Affichage de <strong>{(tiers.current_page - 1) * tiers.per_page + 1}</strong> à <strong>{Math.min(tiers.current_page * tiers.per_page, tiers.total)}</strong> sur <strong>{tiers.total}</strong> {typeLabel.toLowerCase()}s
                            </span>
                            <div className="flex items-center space-x-1.5">
                                {tiers.links.map((link, idx) => {
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

            {/* Delete Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-md p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-3xl shadow-2xl p-6">
                        <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-850 dark:text-white mb-2">Supprimer ?</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                            Supprimer le {typeLabel.toLowerCase()} <strong className="text-slate-800 dark:text-slate-100">"{deleteTarget.label}"</strong> ? Action irréversible.
                        </p>
                        <div className="flex items-center justify-end space-x-3">
                            <button onClick={() => setDeleteTarget(null)} className="px-5 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-all">Annuler</button>
                            <button onClick={() => router.delete(route(`tiers.${type}.destroy`, deleteTarget.id), { onSuccess: () => setDeleteTarget(null) })}
                                className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-2xl transition-all active:scale-[0.97]">Supprimer</button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
