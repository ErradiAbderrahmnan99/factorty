import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

interface Devise {
    id: number;
    code: string;
    symbole: string;
}

interface CompteBancaire {
    id: number;
    label: string;
    banque: string | null;
    rib: string | null;
    iban: string | null;
    swift: string | null;
    devise?: Devise | null;
    solde_min: number;
    solde: number;
    status: 'ouvert' | 'ferme';
}

interface Reglement {
    id: number;
    ref: string;
    type: string;
}

interface EcritureBancaire {
    id: number;
    compte_bancaire_id: number;
    ref: string;
    date_operation: string;
    date_valeur: string | null;
    description: string | null;
    reglement_id: number | null;
    reglement?: Reglement | null;
    type: string;
    origin_type: string | null;
    origin_id: number | null;
    origin?: {
        id: number;
        ref: string;
    } | null;
    numero_transaction: string | null;
    amount: number;
    sense: 'd' | 'c';
    created_at: string;
}

interface PaginatedData<T> {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
    current_page: number;
    last_page: number;
    total: number;
}

export default function Ecritures({
    compte,
    ecritures,
}: {
    compte: CompteBancaire;
    ecritures: PaginatedData<EcritureBancaire>;
}) {
    const getOriginDisplay = (item: EcritureBancaire) => {
        if (!item.origin_type) return '—';
        const modelName = item.origin_type.split('\\').pop() || '';
        // Beautify name: e.g. FactureVente -> Facture Vente
        const formattedModel = modelName.replace(/([A-Z])/g, ' $1').trim();
        if (item.origin && 'ref' in item.origin) {
            return `${formattedModel} : ${(item.origin as any).ref}`;
        }
        return `${formattedModel} #${item.origin_id || '?'}`;
    };

    return (
        <AuthenticatedLayout header={
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 max-w-7xl mx-auto">
                <div>
                    <div className="flex items-center space-x-2 text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        <span>DDB</span><span>/</span>
                        <Link href={route('comptes-bancaires.index')} className="hover:text-indigo-600 transition-colors">Comptes Bancaires</Link><span>/</span>
                        <span className="text-indigo-650 dark:text-indigo-400">Écritures</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                        Grand Livre : {compte.label}
                    </h2>
                </div>
                <Link
                    href={route('comptes-bancaires.index')}
                    className="inline-flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-705 dark:text-slate-200 font-bold text-xs uppercase tracking-widest rounded-2xl h-[42px] px-6 transition-all active:scale-[0.97]"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>Retour</span>
                </Link>
            </div>
        }>
            <Head title={`Écritures Bancaires - ${compte.label}`} />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Account Details Card */}
                <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl p-6 backdrop-blur-xl">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                            <span className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Banque & RIB</span>
                            <span className="text-sm font-bold text-slate-850 dark:text-white">{compte.banque || 'Non spécifiée'}</span>
                            <span className="block text-[11px] font-mono text-slate-450 dark:text-slate-400 mt-1">{compte.rib || 'Aucun RIB renseigné'}</span>
                        </div>
                        <div>
                            <span className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">IBAN & SWIFT</span>
                            <span className="block text-xs font-mono text-slate-700 dark:text-slate-350">{compte.iban || '—'}</span>
                            <span className="block text-[10px] font-mono text-slate-450 dark:text-slate-400 mt-0.5">{compte.swift || '—'}</span>
                        </div>
                        <div>
                            <span className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Configuration</span>
                            <div className="flex items-center space-x-2.5 mt-1">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                                    compte.status === 'ouvert'
                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                        : 'bg-slate-500/10 text-slate-550 dark:text-slate-400 border border-slate-500/20'
                                }`}>
                                    {compte.status === 'ouvert' ? 'Ouvert' : 'Fermé'}
                                </span>
                                {compte.devise && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350">
                                        {compte.devise.code} ({compte.devise.symbole})
                                    </span>
                                )}
                            </div>
                            <span className="block text-[10px] text-rose-500 dark:text-rose-405 font-bold mt-1.5">
                                Solde Min: {compte.solde_min ? `${compte.solde_min.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${compte.devise?.symbole || ''}` : '0.00'}
                            </span>
                        </div>
                        <div className="flex flex-col justify-center items-start md:items-end md:border-l border-slate-100 dark:border-slate-800 md:pl-6">
                            <span className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Solde Actuel</span>
                            <span className={`text-2xl font-black ${compte.solde < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-605 dark:text-emerald-400'}`}>
                                {compte.solde.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-sm font-bold text-slate-500">{compte.devise?.symbole || ''}</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Operations Ledger Table Card */}
                <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl overflow-hidden backdrop-blur-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/70 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800/50">
                                    <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Date d'Opé.</th>
                                    <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Date Valeur</th>
                                    <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Référence</th>
                                    <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Type / Origine</th>
                                    <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Numéro Transaction</th>
                                    <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Description</th>
                                    <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-center">Sens</th>
                                    <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-right">Montant</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/70 dark:divide-slate-800/70">
                                {ecritures.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-16 text-center text-xs text-slate-400">
                                            Aucune écriture enregistrée pour ce compte.
                                        </td>
                                    </tr>
                                ) : ecritures.data.map(item => (
                                    <tr key={item.id} className="hover:bg-indigo-50/20 dark:hover:bg-indigo-950/5 transition-all">
                                        <td className="py-3.5 px-6 text-xs font-semibold text-slate-600 dark:text-slate-350">{item.date_operation}</td>
                                        <td className="py-3.5 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400">{item.date_valeur || '—'}</td>
                                        <td className="py-3.5 px-6">
                                            {item.reglement_id ? (
                                                <Link href={route('reglements.index', { search: item.ref })} className="text-xs font-black text-indigo-600 hover:text-indigo-755 dark:text-indigo-400 dark:hover:text-indigo-350 hover:underline">
                                                    {item.ref}
                                                </Link>
                                            ) : (
                                                <span className="text-xs font-black text-slate-800 dark:text-slate-200">{item.ref}</span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-6">
                                            <div className="flex flex-col gap-0.5">
                                                <span className={`inline-flex items-center self-start px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-widest ${
                                                    item.type === 'vente'
                                                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/10'
                                                        : 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/10'
                                                }`}>
                                                    {item.type}
                                                </span>
                                                <span className="text-[10px] font-medium text-slate-450 dark:text-slate-500">{getOriginDisplay(item)}</span>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-6 text-xs font-mono text-slate-600 dark:text-slate-400">{item.numero_transaction || '—'}</td>
                                        <td className="py-3.5 px-6 text-xs text-slate-500 dark:text-slate-400 max-w-[200px] truncate" title={item.description || ''}>
                                            {item.description || '—'}
                                        </td>
                                        <td className="py-3.5 px-6 text-center">
                                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-black uppercase ${
                                                item.sense === 'd'
                                                    ? 'bg-emerald-500/10 text-emerald-600'
                                                    : 'bg-rose-500/10 text-rose-600'
                                            }`}>
                                                {item.sense === 'd' ? 'D' : 'C'}
                                            </span>
                                        </td>
                                        <td className={`py-3.5 px-6 text-right text-xs font-black ${
                                            item.sense === 'd' ? 'text-emerald-605 dark:text-emerald-450' : 'text-slate-800 dark:text-slate-200'
                                        }`}>
                                            {item.sense === 'd' ? '+' : '-'}{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {compte.devise?.symbole || ''}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {ecritures.last_page > 1 && (
                        <div className="p-6 border-t border-slate-100 dark:border-slate-800/60 flex justify-between items-center bg-slate-50/20">
                            <span className="text-xs font-semibold text-slate-450">
                                Affichage de {ecritures.data.length} sur {ecritures.total}
                            </span>
                            <div className="flex gap-1.5">
                                {ecritures.links.map((link, idx) => {
                                    if (!link.url) return null;
                                    return (
                                        <Link
                                            key={idx}
                                            href={link.url}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                                                link.active
                                                    ? 'bg-indigo-650 text-white shadow-md shadow-indigo-500/15'
                                                    : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-350 border border-slate-200/50 dark:border-slate-800/50'
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
        </AuthenticatedLayout>
    );
}
