import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import InputError from '@/Components/InputError';

interface Devise {
    id: number;
    code: string;
    symbole: string;
}

interface Item {
    id: number;
    label: string;
    banque: string | null;
    rib: string | null;
    iban: string | null;
    swift: string | null;
    devise_id: number | null;
    devise?: Devise | null;
    solde_min: number;
    solde: number;
    status: 'ouvert' | 'ferme';
}

export default function Index({ items, devises }: { items: Item[]; devises: Devise[] }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Item | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);

    const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm({
        label: '',
        banque: '',
        rib: '',
        iban: '',
        swift: '',
        devise_id: '',
        solde_min: 0,
        status: 'ouvert' as 'ouvert' | 'ferme',
    });

    const openCreate = () => {
        reset(); clearErrors();
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const openEdit = (item: Item) => {
        setData({
            label: item.label,
            banque: item.banque || '',
            rib: item.rib || '',
            iban: item.iban || '',
            swift: item.swift || '',
            devise_id: item.devise_id ? String(item.devise_id) : '',
            solde_min: item.solde_min,
            status: item.status,
        });
        clearErrors();
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingItem) {
            patch(route('comptes-bancaires.update', editingItem.id), {
                onSuccess: () => { setIsModalOpen(false); reset(); },
            });
        } else {
            post(route('comptes-bancaires.store'), {
                onSuccess: () => { setIsModalOpen(false); reset(); },
            });
        }
    };

    return (
        <AuthenticatedLayout header={
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 max-w-7xl mx-auto">
                <div>
                    <div className="flex items-center space-x-2 text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        <span>DDB</span><span>/</span>
                        <span className="text-indigo-600 dark:text-indigo-400">Comptes Bancaires</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                        Comptes Bancaires <span className="text-slate-400 dark:text-slate-600 text-lg font-bold">·</span>
                        <span className="ml-2 text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-lg">{items.length}</span>
                    </h2>
                </div>
                <button onClick={openCreate} className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-widest rounded-2xl h-[42px] px-6 transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.97]">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                    <span>Ajouter</span>
                </button>
            </div>
        }>
            <Head title="Comptes Bancaires" />
            <div className="max-w-7xl mx-auto">
                <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl overflow-hidden backdrop-blur-xl">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/70 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800/50">
                                <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Intitulé</th>
                                <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Banque</th>
                                <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Devise</th>
                                <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-right">Solde Min. Autorisé</th>
                                <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-right">Solde Actuel</th>
                                <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-center">État</th>
                                <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-right w-36">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/70 dark:divide-slate-800/70">
                            {items.length === 0 ? (
                                <tr><td colSpan={7} className="py-16 text-center text-xs text-slate-400">Aucun compte bancaire. Cliquez sur "Ajouter".</td></tr>
                            ) : items.map(item => (
                                <tr key={item.id} className="hover:bg-indigo-50/20 dark:hover:bg-indigo-950/5 group transition-all">
                                    <td className="py-3.5 px-6">
                                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{item.label}</div>
                                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">{item.rib || 'Aucun RIB'}</div>
                                    </td>
                                    <td className="py-3.5 px-6 text-sm font-semibold text-slate-500 dark:text-slate-400">{item.banque || '—'}</td>
                                    <td className="py-3.5 px-6">
                                        {item.devise ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350">
                                                {item.devise.code} ({item.devise.symbole})
                                            </span>
                                        ) : (
                                            <span className="text-xs text-slate-400">—</span>
                                        )}
                                    </td>
                                    <td className="py-3.5 px-6 text-right text-xs font-bold text-rose-500 dark:text-rose-400">
                                        {item.solde_min ? `${item.solde_min.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${item.devise?.symbole || ''}` : '0.00'}
                                    </td>
                                    <td className={`py-3.5 px-6 text-right text-sm font-black ${item.solde < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-450'}`}>
                                        {item.solde.toLocaleString(undefined, { minimumFractionDigits: 2 })} {item.devise?.symbole || ''}
                                    </td>
                                    <td className="py-3.5 px-6 text-center">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                                            item.status === 'ouvert'
                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                                : 'bg-slate-500/10 text-slate-550 dark:text-slate-400 border border-slate-500/20'
                                        }`}>
                                            {item.status === 'ouvert' ? 'Ouvert' : 'Fermé'}
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-6 text-right">
                                        <div className="flex items-center justify-end space-x-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <Link href={route('comptes-bancaires.ecritures', item.id)} className="p-2 text-slate-450 hover:text-indigo-600 hover:bg-indigo-500/10 rounded-xl transition-all" title="Voir les écritures bancaires (Grand Livre)">
                                                <svg className="h-4 w-4 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </Link>
                                            <button onClick={() => openEdit(item)} className="p-2 text-slate-400 hover:text-indigo-650 hover:bg-indigo-500/10 rounded-xl transition-all" title="Modifier le compte">
                                                <svg className="h-4 w-4 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                            </button>
                                            <button onClick={() => setDeleteTarget(item)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-all" title="Supprimer le compte">
                                                <svg className="h-4 w-4 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-md p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl p-6">
                        <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-850 dark:text-white mb-5">
                            {editingItem ? 'Modifier le Compte' : 'Nouveau Compte Bancaire'}
                        </h3>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Intitulé du compte <span className="text-rose-500">*</span></label>
                                    <input className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-3 px-4 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                                        value={data.label} onChange={e => setData('label', e.target.value)} placeholder="ex: Compte Principal, Caisse" required />
                                    <InputError message={errors.label} className="mt-1" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Nom de la Banque</label>
                                    <input className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-3 px-4 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                                        value={data.banque} onChange={e => setData('banque', e.target.value)} placeholder="ex: Attijariwafa Bank" />
                                    <InputError message={errors.banque} className="mt-1" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Devise</label>
                                    <select className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-3 px-4 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                                        value={data.devise_id} onChange={e => setData('devise_id', e.target.value)}>
                                        <option value="">Sélectionner une devise...</option>
                                        {devises.map(d => (
                                            <option key={d.id} value={d.id}>{d.code} ({d.symbole})</option>
                                        ))}
                                    </select>
                                    <InputError message={errors.devise_id} className="mt-1" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Solde minimum autorisé</label>
                                    <input type="number" step="any" className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-3 px-4 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                                        value={data.solde_min} onChange={e => setData('solde_min', parseFloat(e.target.value) || 0)} placeholder="ex: -5000" />
                                    <InputError message={errors.solde_min} className="mt-1" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">État du compte <span className="text-rose-500">*</span></label>
                                    <select className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-3 px-4 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                                        value={data.status} onChange={e => setData('status', e.target.value as any)} required>
                                        <option value="ouvert">Ouvert</option>
                                        <option value="ferme">Fermé</option>
                                    </select>
                                    <InputError message={errors.status} className="mt-1" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">RIB</label>
                                    <input className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-3 px-4 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                                        value={data.rib} onChange={e => setData('rib', e.target.value)} placeholder="ex: 24 chiffres" />
                                    <InputError message={errors.rib} className="mt-1" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">IBAN</label>
                                    <input className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-3 px-4 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                                        value={data.iban} onChange={e => setData('iban', e.target.value)} placeholder="ex: MA..." />
                                    <InputError message={errors.iban} className="mt-1" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">SWIFT / BIC</label>
                                    <input className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-3 px-4 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                                        value={data.swift} onChange={e => setData('swift', e.target.value)} placeholder="ex: BCMA..." />
                                    <InputError message={errors.swift} className="mt-1" />
                                </div>
                            </div>

                            <div className="flex items-center justify-end space-x-3 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-xs font-bold text-slate-655 dark:text-slate-350 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-750 transition-all">Annuler</button>
                                <button type="submit" disabled={processing} className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl transition-all active:scale-[0.97] disabled:opacity-60">
                                    {processing ? 'Enregistrement...' : 'Enregistrer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirm Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-md p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-3xl shadow-2xl p-6">
                        <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-850 dark:text-white mb-2">Supprimer ?</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">Supprimer le compte bancaire <strong>"{deleteTarget.label}"</strong> ? Cette action est irréversible.</p>
                        <div className="flex items-center justify-end space-x-3">
                            <button onClick={() => setDeleteTarget(null)} className="px-5 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-all">Annuler</button>
                            <button onClick={() => { router.delete(route('comptes-bancaires.destroy', deleteTarget.id), { onSuccess: () => setDeleteTarget(null) }); }}
                                className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-2xl transition-all active:scale-[0.97]">Supprimer</button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
