import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        numero: '',
        libelle: '',
        nature: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('classes-comptables.store'));
    };

    return (
        <AuthenticatedLayout header={
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 max-w-7xl mx-auto">
                <div>
                    <div className="flex items-center space-x-2 text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                        <Link href={route('classes-comptables.index')} className="hover:text-indigo-500 transition-colors">Classes Comptables</Link>
                        <span>/</span>
                        <span className="text-indigo-600 dark:text-indigo-400">Création</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Nouvelle Classe Comptable</h2>
                </div>
                <div className="flex items-center space-x-3">
                    <Link href={route('classes-comptables.index')}
                        className="px-5 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95">
                        Annuler
                    </Link>
                    <button onClick={handleSubmit} disabled={processing}
                        className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-2xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50 disabled:pointer-events-none">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                        <span>Enregistrer</span>
                    </button>
                </div>
            </div>
        }>
            <Head title="Nouvelle Classe Comptable" />

            <div className="max-w-4xl mx-auto">
                <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-8 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Numéro */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-455 uppercase tracking-widest mb-1.5">Numéro <span className="text-rose-500">*</span></label>
                                <input type="text" placeholder="Ex: 1" value={data.numero} onChange={e => setData('numero', e.target.value)}
                                    className="w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50/40 dark:bg-slate-950/40 text-xs font-bold text-slate-850 dark:text-slate-200 py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all" />
                                {errors.numero && <div className="text-rose-500 text-[10px] font-bold mt-1.5">{errors.numero}</div>}
                            </div>
                            
                            {/* Libellé */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-455 uppercase tracking-widest mb-1.5">Libellé <span className="text-rose-500">*</span></label>
                                <input type="text" placeholder="Ex: Comptes de capitaux" value={data.libelle} onChange={e => setData('libelle', e.target.value)}
                                    className="w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50/40 dark:bg-slate-950/40 text-xs font-bold text-slate-850 dark:text-slate-200 py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all" />
                                {errors.libelle && <div className="text-rose-500 text-[10px] font-bold mt-1.5">{errors.libelle}</div>}
                            </div>

                            {/* Nature */}
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-black text-slate-455 uppercase tracking-widest mb-1.5">Nature</label>
                                <input type="text" placeholder="Ex: Bilan - Passif" value={data.nature} onChange={e => setData('nature', e.target.value)}
                                    className="w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50/40 dark:bg-slate-950/40 text-xs font-bold text-slate-850 dark:text-slate-200 py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all" />
                                {errors.nature && <div className="text-rose-500 text-[10px] font-bold mt-1.5">{errors.nature}</div>}
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
