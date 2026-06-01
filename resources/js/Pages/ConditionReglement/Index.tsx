import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import InputError from '@/Components/InputError';

interface Item {
    id: number;
    label: string;
    nb_jours: number;
}

export default function Index({ items }: { items: Item[] }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Item | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);

    const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm({
        label: '',
        nb_jours: 0,
    });

    const openCreate = () => {
        reset(); clearErrors();
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const openEdit = (item: Item) => {
        setData({ label: item.label, nb_jours: item.nb_jours });
        clearErrors();
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingItem) {
            patch(route('conditions-reglement.update', editingItem.id), {
                onSuccess: () => { setIsModalOpen(false); reset(); },
            });
        } else {
            post(route('conditions-reglement.store'), {
                onSuccess: () => { setIsModalOpen(false); reset(); },
            });
        }
    };

    return (
        <AuthenticatedLayout header={
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 max-w-5xl mx-auto">
                <div>
                    <div className="flex items-center space-x-2 text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        <span>DDB</span><span>/</span>
                        <span className="text-indigo-600 dark:text-indigo-400">Conditions de Règlement</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                        Conditions de Règlement <span className="text-slate-400 dark:text-slate-600 text-lg font-bold">·</span>
                        <span className="ml-2 text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-lg">{items.length}</span>
                    </h2>
                </div>
                <button onClick={openCreate} className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-widest rounded-2xl h-[42px] px-6 transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.97]">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                    <span>Ajouter</span>
                </button>
            </div>
        }>
            <Head title="Conditions de Règlement" />
            <div className="max-w-5xl mx-auto">
                <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl overflow-hidden backdrop-blur-xl">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/70 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800/50">
                                <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Libellé</th>
                                <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest w-40">Nombre de Jours</th>
                                <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-right w-28">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/70 dark:divide-slate-800/70">
                            {items.length === 0 ? (
                                <tr><td colSpan={3} className="py-16 text-center text-xs text-slate-400">Aucune condition de règlement. Cliquez sur "Ajouter".</td></tr>
                            ) : items.map(item => (
                                <tr key={item.id} className="hover:bg-indigo-50/20 dark:hover:bg-indigo-950/5 group transition-all">
                                    <td className="py-3.5 px-6 text-sm font-semibold text-slate-800 dark:text-slate-200">{item.label}</td>
                                    <td className="py-3.5 px-6 text-sm font-bold text-indigo-650 dark:text-indigo-400">{item.nb_jours} jours</td>
                                    <td className="py-3.5 px-6 text-right">
                                        <div className="flex items-center justify-end space-x-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEdit(item)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-500/10 rounded-xl transition-all">
                                                <svg className="h-4 w-4 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                            </button>
                                            <button onClick={() => setDeleteTarget(item)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-all">
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
                        <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-850 dark:text-white mb-5">
                            {editingItem ? 'Modifier la Condition' : 'Nouvelle Condition de Règlement'}
                        </h3>
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Libellé</label>
                                <input className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-3 px-4 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                                    value={data.label} onChange={e => setData('label', e.target.value)} placeholder="ex: 30 Jours Fin de Mois" required />
                                <InputError message={errors.label} className="mt-1" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Nombre de Jours</label>
                                <input type="number" className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-3 px-4 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                                    value={data.nb_jours} onChange={e => setData('nb_jours', parseInt(e.target.value) || 0)} placeholder="ex: 30" required />
                                <InputError message={errors.nb_jours} className="mt-1" />
                            </div>
                            <div className="flex items-center justify-end space-x-3 pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-xs font-bold text-slate-650 dark:text-slate-350 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-750 transition-all">Annuler</button>
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
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">Supprimer la condition <strong>"{deleteTarget.label}"</strong> ? Cette action est irréversible.</p>
                        <div className="flex items-center justify-end space-x-3">
                            <button onClick={() => setDeleteTarget(null)} className="px-5 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-all">Annuler</button>
                            <button onClick={() => { router.delete(route('conditions-reglement.destroy', deleteTarget.id), { onSuccess: () => setDeleteTarget(null) }); }}
                                className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-2xl transition-all active:scale-[0.97]">Supprimer</button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
