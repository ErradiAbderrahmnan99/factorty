import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useRef } from 'react';

interface Tier {
    id: number;
    label: string;
}

interface ModeReglement {
    id: number;
    label: string;
}

interface CompteBancaire {
    id: number;
    label: string;
}

interface StatutReglement {
    id: number;
    label: string;
    mode_reglement_id: number;
    is_banque: boolean;
    mode_reglement?: ModeReglement;
}

interface Reglement {
    id: number;
    ref: string;
    type: 'vente' | 'achat';
    tier_id: number;
    date_saisie: string;
    date_reglement: string;
    montant_ttc: number;
    mode_reglement_id: number;
    statut_reglement_id: number;
    compte_bancaire_id: number | null;
    numero_transaction: string | null;
    emetteur: string | null;
    banque_cheque: string | null;
    commentaire: string | null;
    sense: 'd' | 'c';
    tier?: Tier;
    mode_reglement?: ModeReglement;
    statut_reglement?: StatutReglement;
    compte_bancaire?: CompteBancaire;
    created_at: string;
}

interface PaginatedData<T> {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
    current_page: number;
    last_page: number;
    total: number;
}

export default function Index({
    reglements,
    statuts,
    filters,
}: {
    reglements: PaginatedData<Reglement>;
    statuts: StatutReglement[];
    filters: { search?: string; type?: string; statut_reglement_id?: string; sense?: string };
}) {
    const [search, setSearch] = useState(filters.search || '');
    const [type, setType] = useState(filters.type || '');
    const [statutReglementId, setStatutReglementId] = useState(filters.statut_reglement_id || '');
    const [sense, setSense] = useState(filters.sense || '');

    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const toastTimer = useRef<any>(null);

    const showToast = (message: string, type: 'success' | 'error' = 'error') => {
        if (toastTimer.current) clearTimeout(toastTimer.current);
        setToast({ type, message });
        toastTimer.current = setTimeout(() => setToast(null), 5000);
    };

    const handleSearch = () => {
        router.get(
            route('reglements.index'),
            { search, type, statut_reglement_id: statutReglementId, sense },
            { preserveState: true }
        );
    };

    const handleClear = () => {
        setSearch('');
        setType('');
        setStatutReglementId('');
        setSense('');
        router.get(route('reglements.index'));
    };

    const handleDelete = (id: number) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce règlement ?')) {
            router.delete(route('reglements.destroy', id), {
                onSuccess: () => showToast('Règlement supprimé avec succès.', 'success'),
                onError: (err: any) => showToast(err.message || 'Une erreur est survenue.'),
            });
        }
    };

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center space-x-2 text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest max-w-7xl mx-auto">
                <span className="text-indigo-650 dark:text-indigo-400">Règlements</span>
            </div>
        }>
            <Head title="Règlements" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Card */}
                <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Gestion des Règlements</h2>
                        <p className="text-xs text-slate-455 mt-1 leading-relaxed">Suivez et gérez tous les encaissements clients et décaissements fournisseurs.</p>
                    </div>
                    <Link
                        href={route('reglements.create')}
                        className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-3 rounded-2xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95 shrink-0"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Nouveau Règlement</span>
                    </Link>
                </div>

                {/* Filters Row */}
                <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
                        <div className="md:col-span-2">
                            <label className="block text-[9px] font-black text-slate-450 uppercase tracking-widest mb-1.5">Rechercher</label>
                            <input
                                type="text"
                                placeholder="Réf, transaction, émetteur..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50/40 dark:bg-slate-950/40 text-xs font-semibold text-slate-800 dark:text-slate-200 py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-[9px] font-black text-slate-450 uppercase tracking-widest mb-1.5">Type</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50/40 dark:bg-slate-950/40 text-xs font-semibold text-slate-800 dark:text-slate-200 py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all"
                            >
                                <option value="">Tous</option>
                                <option value="vente">Vente (Encaissement)</option>
                                <option value="achat">Achat (Décaissement)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[9px] font-black text-slate-455 uppercase tracking-widest mb-1.5">Statut</label>
                            <select
                                value={statutReglementId}
                                onChange={(e) => setStatutReglementId(e.target.value)}
                                className="w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50/40 dark:bg-slate-950/40 text-xs font-semibold text-slate-800 dark:text-slate-200 py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all"
                            >
                                <option value="">Tous</option>
                                {statuts.map((st) => (
                                    <option key={st.id} value={st.id}>
                                        {st.label} {st.mode_reglement ? `(${st.mode_reglement.label})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[9px] font-black text-slate-450 uppercase tracking-widest mb-1.5">Sens</label>
                            <select
                                value={sense}
                                onChange={(e) => setSense(e.target.value)}
                                className="w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50/40 dark:bg-slate-950/40 text-xs font-semibold text-slate-800 dark:text-slate-200 py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all"
                            >
                                <option value="">Tous</option>
                                <option value="d">Débit (+)</option>
                                <option value="c">Crédit (-)</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2.5 pt-2">
                        <button
                            onClick={handleClear}
                            className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-350 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-755 transition-all active:scale-95"
                        >
                            Réinitialiser
                        </button>
                        <button
                            onClick={handleSearch}
                            className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-500/25 active:scale-95"
                        >
                            Filtrer
                        </button>
                    </div>
                </div>

                {/* Table Card */}
                <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl overflow-hidden backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/40 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
                                    <th className="py-4.5 px-6">Référence</th>
                                    <th className="py-4.5 px-6">Type</th>
                                    <th className="py-4.5 px-6">Tiers</th>
                                    <th className="py-4.5 px-6">Date Règlement</th>
                                    <th className="py-4.5 px-6">Mode</th>
                                    <th className="py-4.5 px-6">Compte Bancaire</th>
                                    <th className="py-4.5 px-6 text-center">Sens</th>
                                    <th className="py-4.5 px-6 text-right">Montant TTC</th>
                                    <th className="py-4.5 px-6 text-center">Statut</th>
                                    <th className="py-4.5 px-6 text-center w-24">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/30">
                                {reglements.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="py-12 text-center text-xs font-semibold text-slate-400">
                                            Aucun règlement trouvé.
                                        </td>
                                    </tr>
                                ) : (
                                    reglements.data.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/10 transition-colors">
                                            <td className="py-4 px-6 text-xs font-black text-slate-800 dark:text-white">
                                                {item.ref}
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-[9px] font-extrabold uppercase tracking-widest border ${
                                                    item.type === 'vente'
                                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                                        : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
                                                }`}>
                                                    {item.type === 'vente' ? 'Vente' : 'Achat'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-xs font-bold text-slate-650 dark:text-slate-300">
                                                {item.tier?.label || '—'}
                                            </td>
                                            <td className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                {item.date_reglement}
                                            </td>
                                            <td className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                {item.mode_reglement?.label || '—'}
                                            </td>
                                            <td className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                {item.compte_bancaire?.label || '—'}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-black uppercase ${
                                                    item.sense === 'd'
                                                        ? 'bg-emerald-500/10 text-emerald-600'
                                                        : 'bg-rose-500/10 text-rose-600'
                                                }`}>
                                                    {item.sense === 'd' ? 'D' : 'C'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-xs font-black text-right text-slate-900 dark:text-white">
                                                {Number(item.montant_ttc).toFixed(2)} DH
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-[9px] font-extrabold uppercase tracking-widest border ${
                                                    item.statut_reglement?.is_banque
                                                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                                        : 'bg-slate-100 text-slate-500 border-slate-200'
                                                }`}>
                                                    {item.statut_reglement?.label || '—'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Link
                                                        href={route('reglements.edit', item.id)}
                                                        className="h-7 w-7 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-550 dark:text-slate-350 transition-all"
                                                        title="Modifier"
                                                    >
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="h-7 w-7 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 transition-all"
                                                        title="Supprimer"
                                                    >
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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

                    {/* Pagination */}
                    {reglements.last_page > 1 && (
                        <div className="p-6 border-t border-slate-100 dark:border-slate-800/60 flex justify-between items-center bg-slate-50/20">
                            <span className="text-xs font-semibold text-slate-450">
                                Affichage de {reglements.data.length} sur {reglements.total}
                            </span>
                            <div className="flex gap-1.5">
                                {reglements.links.map((link, idx) => {
                                    if (!link.url) return null;
                                    return (
                                        <Link
                                            key={idx}
                                            href={link.url}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                                                link.active
                                                    ? 'bg-indigo-650 text-white shadow-md shadow-indigo-500/15'
                                                    : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-800/50'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Toast alerts */}
            {toast && (
                <div className="fixed top-5 right-5 z-[100] max-w-sm w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[2rem] shadow-3xl p-4 animate-slide-in backdrop-blur-xl">
                    <div className="flex items-start space-x-3.5">
                        <div className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 ${toast.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'}`}>
                            {toast.type === 'success' ? (
                                <svg className="h-5 w-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            ) : (
                                <svg className="h-5 w-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-855 dark:text-white">{toast.type === 'success' ? 'Succès' : 'Erreur'}</h4>
                            <p className="text-xs font-semibold text-slate-500 mt-1 leading-relaxed">{toast.message}</p>
                        </div>
                        <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-650 transition-all shrink-0">
                            <svg className="h-4 w-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
