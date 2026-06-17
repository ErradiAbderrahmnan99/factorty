import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';

interface Fourchette {
    id: number;
    debut: string;
    fin: string;
}

interface NatureCompte {
    id: number;
    code: string;
    label: string;
    fourchettes: Fourchette[];
}

export default function Index({ natures }: { natures: NatureCompte[] }) {
    const { flash } = usePage().props as any;
    const [selectedNatureId, setSelectedNatureId] = useState<number | null>(natures.length > 0 ? natures[0].id : null);
    const [localFlash, setLocalFlash] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Form for new fourchette
    const formFourchette = useForm({ debut: '', fin: '' });

    const selectedNature = natures.find(n => n.id === selectedNatureId);

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

    const handleAddFourchette = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedNatureId) return;
        formFourchette.post(route('nature-compte.fourchettes.store', selectedNatureId), {
            onSuccess: () => formFourchette.reset(),
        });
    };

    const handleDeleteFourchette = (id: number) => {
        router.delete(route('nature-compte.fourchettes.destroy', id));
    };

    return (
        <AuthenticatedLayout header={
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 max-w-7xl mx-auto">
                <div>
                    <div className="flex items-center space-x-2 text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        <span>Paramétrage</span><span>/</span>
                        <span className="text-indigo-600 dark:text-indigo-400">Nature de Compte</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1.5">Nature de Compte</h2>
                </div>
            </div>
        }>
            <Head title="Nature de Compte" />

            <div className="max-w-7xl mx-auto space-y-6">
                <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl overflow-hidden backdrop-blur-xl flex flex-col md:flex-row min-h-[600px]">
                    
                    {/* Left Panel: Nature List */}
                    <div className="w-full md:w-1/3 border-r border-slate-200/50 dark:border-slate-800/50 flex flex-col bg-slate-50/30 dark:bg-slate-950/20">
                        <div className="p-4 border-b border-slate-200/50 dark:border-slate-800/50">
                            <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Natures de Journaux</h3>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto">
                            {natures.map(nature => (
                                <div key={nature.id} onClick={() => setSelectedNatureId(nature.id)}
                                    className={`flex items-center justify-between px-4 py-3 cursor-pointer border-b border-slate-100/50 dark:border-slate-800/30 transition-colors ${selectedNatureId === nature.id ? 'bg-indigo-50/80 dark:bg-indigo-500/10 border-l-4 border-l-indigo-600' : 'hover:bg-slate-100/50 dark:hover:bg-slate-800/30 border-l-4 border-l-transparent'}`}>
                                    <span className={`text-xs font-bold ${selectedNatureId === nature.id ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>{nature.code} - {nature.label}</span>
                                </div>
                            ))}
                            {natures.length === 0 && (
                                <div className="p-8 text-center text-xs font-semibold text-slate-400">Aucune nature créée.</div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Fourchettes */}
                    <div className="w-full md:w-2/3 flex flex-col">
                        {selectedNature ? (
                            <>
                                <div className="p-5 border-b border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-950/10">
                                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 mb-1">Fourchettes pour : <span className="text-indigo-600 dark:text-indigo-400">{selectedNature.code} - {selectedNature.label}</span></h3>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Définissez les plages de comptes acceptées</p>
                                </div>

                                <div className="flex-1 overflow-y-auto p-5">
                                    {selectedNature.fourchettes.length === 0 ? (
                                        <div className="text-center text-xs font-semibold text-slate-400 py-12">Aucune fourchette définie pour cette nature.</div>
                                    ) : (
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-slate-200/50 dark:border-slate-800/50 text-[10px] font-extrabold text-slate-455 uppercase tracking-widest">
                                                    <th className="py-3 px-4">Début de fourchette</th>
                                                    <th className="py-3 px-4">Fin de fourchette</th>
                                                    <th className="py-3 px-4 text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/30">
                                                {selectedNature.fourchettes.map(f => (
                                                    <tr key={f.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/5">
                                                        <td className="py-3 px-4 text-xs font-bold text-slate-700 dark:text-slate-300">{f.debut}</td>
                                                        <td className="py-3 px-4 text-xs font-bold text-slate-700 dark:text-slate-300">{f.fin}</td>
                                                        <td className="py-3 px-4 text-right">
                                                            <button onClick={() => handleDeleteFourchette(f.id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors inline-block">
                                                                <svg className="h-4 w-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>

                                <div className="p-5 border-t border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-950/10">
                                    <form onSubmit={handleAddFourchette} className="flex items-end gap-4">
                                        <div className="flex-1">
                                            <label className="block text-[10px] font-black text-slate-455 uppercase tracking-widest mb-1.5">Début <span className="text-rose-500">*</span></label>
                                            <input type="text" placeholder="Ex: 411" value={formFourchette.data.debut} onChange={e => formFourchette.setData('debut', e.target.value)}
                                                className="w-full rounded-xl border border-slate-200/85 dark:border-slate-800/85 bg-white dark:bg-slate-900 text-xs font-bold text-slate-850 dark:text-slate-200 py-2.5 px-3 focus:outline-none focus:border-indigo-500 transition-all" />
                                            {formFourchette.errors.debut && <div className="text-rose-500 text-[10px] font-bold mt-1">{formFourchette.errors.debut}</div>}
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-[10px] font-black text-slate-455 uppercase tracking-widest mb-1.5">Fin <span className="text-rose-500">*</span></label>
                                            <input type="text" placeholder="Ex: 411ZZZ" value={formFourchette.data.fin} onChange={e => formFourchette.setData('fin', e.target.value)}
                                                className="w-full rounded-xl border border-slate-200/85 dark:border-slate-800/85 bg-white dark:bg-slate-900 text-xs font-bold text-slate-850 dark:text-slate-200 py-2.5 px-3 focus:outline-none focus:border-indigo-500 transition-all" />
                                            {formFourchette.errors.fin && <div className="text-rose-500 text-[10px] font-bold mt-1">{formFourchette.errors.fin}</div>}
                                        </div>
                                        <button type="submit" disabled={formFourchette.processing || !formFourchette.data.debut || !formFourchette.data.fin}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50">
                                            Ajouter
                                        </button>
                                    </form>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400">
                                <svg className="h-16 w-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                <p className="text-sm font-semibold">Sélectionnez une nature de compte</p>
                                <p className="text-xs mt-1">pour configurer ses fourchettes de comptes autorisés.</p>
                            </div>
                        )}
                    </div>
                </div>

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
