import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import InputError from '@/Components/InputError';

interface StatutReglement {
    id: number;
    label: string;
    mode_reglement_id: number;
    is_banque: boolean;
}

interface Item {
    id: number;
    label: string;
    statuts?: StatutReglement[];
}

export default function Index({ items }: { items: Item[] }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Item | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);

    // States for manage statuses modal
    const [activeModeForStatuses, setActiveModeForStatuses] = useState<Item | null>(null);
    const [statusFormMode, setStatusFormMode] = useState<'create' | 'edit'>('create');
    const [statusFormId, setStatusFormId] = useState<number | null>(null);
    const [statusLabel, setStatusLabel] = useState('');
    const [statusIsBanque, setStatusIsBanque] = useState(false);
    const [statusError, setStatusError] = useState<string | null>(null);
    const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);

    const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm({
        label: '',
    });

    const openCreate = () => {
        reset(); clearErrors();
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const openEdit = (item: Item) => {
        setData({ label: item.label });
        clearErrors();
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingItem) {
            patch(route('modes-reglement.update', editingItem.id), {
                onSuccess: () => { setIsModalOpen(false); reset(); },
            });
        } else {
            post(route('modes-reglement.store'), {
                onSuccess: () => { setIsModalOpen(false); reset(); },
            });
        }
    };

    // Status management handlers
    const currentMode = items.find(m => m.id === activeModeForStatuses?.id) || activeModeForStatuses;
    const modeStatuts = currentMode?.statuts || [];

    const openStatuses = (item: Item) => {
        setActiveModeForStatuses(item);
        resetStatusForm();
    };

    const resetStatusForm = () => {
        setStatusFormMode('create');
        setStatusFormId(null);
        setStatusLabel('');
        setStatusIsBanque(false);
        setStatusError(null);
    };

    const editStatus = (status: StatutReglement) => {
        setStatusFormMode('edit');
        setStatusFormId(status.id);
        setStatusLabel(status.label);
        setStatusIsBanque(!!status.is_banque);
        setStatusError(null);
    };

    const submitStatus = (e: React.FormEvent) => {
        e.preventDefault();
        if (!statusLabel.trim()) {
            setStatusError('Le libellé est requis.');
            return;
        }
        setIsSubmittingStatus(true);
        setStatusError(null);

        if (statusFormMode === 'create' && currentMode) {
            router.post(route('statuts-reglement.store'), {
                label: statusLabel,
                is_banque: statusIsBanque,
                mode_reglement_id: currentMode.id
            }, {
                onSuccess: () => {
                    resetStatusForm();
                    setIsSubmittingStatus(false);
                },
                onError: (errs) => {
                    setStatusError(Object.values(errs)[0] || 'Une erreur est survenue.');
                    setIsSubmittingStatus(false);
                }
            });
        } else if (statusFormMode === 'edit' && statusFormId && currentMode) {
            router.patch(route('statuts-reglement.update', statusFormId), {
                label: statusLabel,
                is_banque: statusIsBanque,
                mode_reglement_id: currentMode.id
            }, {
                onSuccess: () => {
                    resetStatusForm();
                    setIsSubmittingStatus(false);
                },
                onError: (errs) => {
                    setStatusError(Object.values(errs)[0] || 'Une erreur est survenue.');
                    setIsSubmittingStatus(false);
                }
            });
        }
    };

    const deleteStatus = (statusId: number) => {
        if (confirm('Voulez-vous vraiment supprimer ce statut ?')) {
            router.delete(route('statuts-reglement.destroy', statusId), {
                onError: (errs) => {
                    alert(Object.values(errs)[0] || 'Une erreur est survenue lors de la suppression.');
                }
            });
        }
    };

    return (
        <AuthenticatedLayout header={
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 max-w-5xl mx-auto">
                <div>
                    <div className="flex items-center space-x-2 text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        <span>DDB</span><span>/</span>
                        <span className="text-indigo-660 dark:text-indigo-400">Modes de Règlement</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                        Modes de Règlement <span className="text-slate-400 dark:text-slate-600 text-lg font-bold">·</span>
                        <span className="ml-2 text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-lg">{items.length}</span>
                    </h2>
                </div>
                <button
                    onClick={openCreate}
                    className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-3 rounded-2xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95 shrink-0"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Nouveau Mode</span>
                </button>
            </div>
        }>
            <Head title="Modes de Règlement" />
            <div className="max-w-5xl mx-auto">
                <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl overflow-hidden backdrop-blur-xl">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/70 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800/50">
                                <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Libellé</th>
                                <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-right w-36">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/70 dark:divide-slate-800/70">
                            {items.length === 0 ? (
                                <tr><td colSpan={2} className="py-16 text-center text-xs text-slate-400">Aucun mode de règlement. Cliquez sur "Ajouter".</td></tr>
                            ) : items.map(item => (
                                <tr key={item.id} className="hover:bg-indigo-50/20 dark:hover:bg-indigo-950/5 group transition-all">
                                    <td className="py-3.5 px-6 text-sm font-semibold text-slate-800 dark:text-slate-200">{item.label}</td>
                                    <td className="py-3.5 px-6 text-right">
                                        <div className="flex items-center justify-end space-x-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openStatuses(item)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-500/10 rounded-xl transition-all" title="Voir les statuts">
                                                <svg className="h-4 w-4 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </button>
                                            <button onClick={() => openEdit(item)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-500/10 rounded-xl transition-all" title="Modifier">
                                                <svg className="h-4 w-4 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                            </button>
                                            <button onClick={() => setDeleteTarget(item)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-all" title="Supprimer">
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
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl shadow-2xl p-6">
                        <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-855 dark:text-white mb-5">
                            {editingItem ? 'Modifier le Mode' : 'Nouveau Mode de Règlement'}
                        </h3>
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Libellé</label>
                                <input className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-3 px-4 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                                    value={data.label} onChange={e => setData('label', e.target.value)} placeholder="ex: Carte Bancaire, Espèces" required />
                                <InputError message={errors.label} className="mt-1" />
                            </div>
                            <div className="flex items-center justify-end space-x-3 pt-2">
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
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 w-full max-w-sm rounded-3xl shadow-2xl p-6">
                        <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-855 dark:text-white mb-2">Supprimer ?</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">Supprimer le mode <strong>"{deleteTarget.label}"</strong> ? Cette action est irréversible.</p>
                        <div className="flex items-center justify-end space-x-3">
                            <button onClick={() => setDeleteTarget(null)} className="px-5 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-all">Annuler</button>
                            <button onClick={() => { router.delete(route('modes-reglement.destroy', deleteTarget.id), { onSuccess: () => setDeleteTarget(null) }); }}
                                className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-2xl transition-all active:scale-[0.97]">Supprimer</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Manage Statuses Modal */}
            {activeModeForStatuses && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-md p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-3xl rounded-3xl shadow-2xl p-6 flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800/80 mb-5">
                            <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-855 dark:text-white">
                                Statuts de Règlement : <span className="text-indigo-650 dark:text-indigo-400">{currentMode?.label}</span>
                            </h3>
                            <button onClick={() => setActiveModeForStatuses(null)} className="text-slate-400 hover:text-slate-655 dark:hover:text-white transition-all">
                                <svg className="h-5 w-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pr-1">
                            {/* Statuses List */}
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Statuts existants ({modeStatuts.length})</h4>
                                {modeStatuts.length === 0 ? (
                                    <p className="text-xs text-slate-450 py-6 text-center">Aucun statut configuré pour ce mode.</p>
                                ) : (
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl overflow-hidden bg-slate-50/20">
                                        {modeStatuts.map((status) => (
                                            <div key={status.id} className="flex justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-all">
                                                <div className="flex flex-col space-y-1">
                                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{status.label}</span>
                                                    <span className={`inline-flex items-center self-start px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-widest ${
                                                        status.is_banque
                                                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                                            : 'bg-slate-100 text-slate-450 border border-slate-200'
                                                    }`}>
                                                        {status.is_banque ? 'Banque' : 'Optionnel'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <button onClick={() => editStatus(status)} className="p-1.5 text-slate-400 hover:text-indigo-650 hover:bg-indigo-500/10 rounded-lg transition-all" title="Modifier">
                                                        <svg className="h-3.5 w-3.5 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                    </button>
                                                    <button onClick={() => deleteStatus(status.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-all" title="Supprimer">
                                                        <svg className="h-3.5 w-3.5 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Statuses Form */}
                            <div className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-800/80 rounded-2xl p-4 self-start">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-455 mb-3">
                                    {statusFormMode === 'create' ? 'Ajouter un Statut' : 'Modifier le Statut'}
                                </h4>
                                <form onSubmit={submitStatus} className="space-y-4">
                                    {statusError && (
                                        <div className="p-3 text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-xl">
                                            {statusError}
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1.5">Libellé <span className="text-rose-500">*</span></label>
                                        <input
                                            className="block w-full rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 text-xs py-2.5 px-3.5 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all font-semibold"
                                            value={statusLabel}
                                            onChange={e => setStatusLabel(e.target.value)}
                                            placeholder="ex: Encaissé, Rejeté"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={statusIsBanque}
                                                onChange={e => setStatusIsBanque(e.target.checked)}
                                                className="rounded border-slate-350 text-indigo-650 focus:ring-indigo-500 h-4.5 w-4.5 cursor-pointer"
                                            />
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-350">Compte bancaire obligatoire</span>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-end space-x-2 pt-2">
                                        {statusFormMode === 'edit' && (
                                            <button
                                                type="button"
                                                onClick={resetStatusForm}
                                                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                                            >
                                                Annuler
                                            </button>
                                        )}
                                        <button
                                            type="submit"
                                            disabled={isSubmittingStatus}
                                            className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all disabled:opacity-60"
                                        >
                                            {isSubmittingStatus ? 'Enregistrement...' : statusFormMode === 'create' ? 'Ajouter' : 'Mettre à jour'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
