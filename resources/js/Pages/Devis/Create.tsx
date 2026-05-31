import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import InputError from '@/Components/InputError';

interface Tier {
    id: number;
    label: string;
    type: string;
}

interface Unit {
    id: number;
    code: string;
    label: string;
}

interface Product {
    id: number;
    ref: string | null;
    label: string;
    sale_price: number;
    sale_unit_id: number | null;
    sale_unit?: Unit;
}

interface Devise {
    id: number;
    code: string;
    label: string;
    symbol: string | null;
}

interface LineItem {
    product_id: string;
    sale_unit_id: string;
    tva: number;
    qty: number;
    pu_ht: number;
    pu_ttc: number;
    remise: number;
    rm: number;
    total_ht: number;
    total_ttc: number;
}

export default function Create({
    tiers,
    products,
    devises,
    units,
    commercials,
}: {
    tiers: Tier[];
    products: Product[];
    devises: Devise[];
    units: Unit[];
    commercials: { id: number; first_name: string; last_name: string; type: string; }[];
}) {
    // Current date format YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];

    const { data, setData, post, processing, errors } = useForm({
        tier_id: '',
        commercial: '',
        date_devis: today,
        duree_validite: 30,
        devise_id: devises.length > 0 ? devises[0].id.toString() : '',
        lines: [] as LineItem[],
    });

    const addLine = () => {
        const newLine: LineItem = {
            product_id: '',
            sale_unit_id: '',
            tva: 20,
            qty: 1,
            pu_ht: 0,
            pu_ttc: 0,
            remise: 0,
            rm: 0,
            total_ht: 0,
            total_ttc: 0,
        };
        setData('lines', [...data.lines, newLine]);
    };

    const removeLine = (index: number) => {
        const updated = [...data.lines];
        updated.splice(index, 1);
        setData('lines', updated);
    };

    const updateLineField = (index: number, field: keyof LineItem, value: any) => {
        const updated = [...data.lines];
        const line = { ...updated[index] };

        if (field === 'product_id') {
            line.product_id = value;
            // Fetch default product details
            const prod = products.find(p => p.id.toString() === value);
            if (prod) {
                line.pu_ht = Number(prod.sale_price) || 0;
                line.sale_unit_id = prod.sale_unit_id ? prod.sale_unit_id.toString() : '';
                line.tva = 20; // default 20%
                line.pu_ttc = Number((line.pu_ht * (1 + line.tva / 100)).toFixed(4));
                line.rm = Number(((line.qty * line.pu_ht) * (line.remise / 100)).toFixed(4));
            }
        } else if (field === 'remise') {
            line.remise = Number(value) || 0;
            line.rm = Number(((line.qty * line.pu_ht) * (line.remise / 100)).toFixed(4));
        } else if (field === 'rm') {
            line.rm = Number(value) || 0;
            const lineHtTotal = line.qty * line.pu_ht;
            line.remise = lineHtTotal > 0 ? Number(((line.rm / lineHtTotal) * 100).toFixed(4)) : 0;
        } else if (field === 'qty' || field === 'tva') {
            line[field] = Number(value) || 0;
            line.pu_ttc = Number((line.pu_ht * (1 + line.tva / 100)).toFixed(4));
            line.rm = Number(((line.qty * line.pu_ht) * (line.remise / 100)).toFixed(4));
        } else if (field === 'pu_ht') {
            line.pu_ht = Number(value) || 0;
            line.pu_ttc = Number((line.pu_ht * (1 + line.tva / 100)).toFixed(4));
            line.rm = Number(((line.qty * line.pu_ht) * (line.remise / 100)).toFixed(4));
        } else if (field === 'pu_ttc') {
            line.pu_ttc = Number(value) || 0;
            line.pu_ht = Number((line.pu_ttc / (1 + line.tva / 100)).toFixed(4));
            line.rm = Number(((line.qty * line.pu_ht) * (line.remise / 100)).toFixed(4));
        } else {
            (line as any)[field] = value;
        }

        // Compute Line Totals
        const lineHt = line.qty * line.pu_ht;
        const discount = line.rm;
        line.total_ht = Math.max(0, lineHt - discount);
        line.total_ttc = line.total_ht * (1 + line.tva / 100);

        updated[index] = line;
        setData('lines', updated);
    };

    // Calculate Summary Totals
    const totalHT = data.lines.reduce((sum, item) => sum + item.total_ht, 0);
    const totalTTC = data.lines.reduce((sum, item) => sum + item.total_ttc, 0);
    const totalTVA = Math.max(0, totalTTC - totalHT);
    const totalRemise = data.lines.reduce((sum, item) => sum + item.rm, 0);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('devis.store'));
    };

    return (
        <AuthenticatedLayout header={
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 max-w-7xl mx-auto">
                <div>
                    <div className="flex items-center space-x-2 text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        <span>Ventes</span><span>/</span>
                        <span>Devis</span><span>/</span>
                        <span className="text-indigo-600 dark:text-indigo-400">Créer</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1.5">
                        Nouveau Devis
                    </h2>
                </div>
                <Link href={route('devis.index')} className="px-5 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-750 transition-all">
                    Retour à la liste
                </Link>
            </div>
        }>
            <Head title="Créer un Devis" />
            <form onSubmit={submit} className="max-w-7xl mx-auto space-y-6">
                
                {/* Devis Details Form */}
                <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl p-6 backdrop-blur-xl space-y-6">
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-850 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">1. Informations Générales</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Tiers (Client / Prospect) <span className="text-rose-500">*</span></label>
                            <select className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all"
                                value={data.tier_id} onChange={e => setData('tier_id', e.target.value)} required>
                                <option value="">Sélectionner un tiers...</option>
                                {tiers.map(t => (
                                    <option key={t.id} value={t.id}>{t.label} ({t.type === 'client' ? 'Client' : 'Prospect'})</option>
                                ))}
                            </select>
                            <InputError message={errors.tier_id} className="mt-1" />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Commercial / Agent</label>
                            <select className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all"
                                value={data.commercial} onChange={e => setData('commercial', e.target.value)}>
                                <option value="">Sélectionner un commercial...</option>
                                {commercials.map(c => {
                                    const fullName = `${c.last_name} ${c.first_name}`;
                                    return (
                                        <option key={c.id} value={fullName}>{fullName} ({c.type})</option>
                                    );
                                })}
                            </select>
                            <InputError message={errors.commercial} className="mt-1" />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Date de Devis <span className="text-rose-500">*</span></label>
                            <input type="date" className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all"
                                value={data.date_devis} onChange={e => setData('date_devis', e.target.value)} required />
                            <InputError message={errors.date_devis} className="mt-1" />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Validité (Jours) <span className="text-rose-500">*</span></label>
                            <input type="number" className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all"
                                value={data.duree_validite} onChange={e => setData('duree_validite', Number(e.target.value) || 0)} min="1" required />
                            <InputError message={errors.duree_validite} className="mt-1" />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Devise <span className="text-rose-500">*</span></label>
                            <select className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all"
                                value={data.devise_id} onChange={e => setData('devise_id', e.target.value)} required>
                                {devises.map(d => (
                                    <option key={d.id} value={d.id}>{d.label} ({d.code})</option>
                                ))}
                            </select>
                            <InputError message={errors.devise_id} className="mt-1" />
                        </div>
                    </div>
                </div>

                {/* Line Items Table */}
                <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl overflow-hidden p-6 backdrop-blur-xl space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-850 dark:text-white">2. Lignes de Devis</h3>
                        <button type="button" onClick={addLine}
                            className="inline-flex items-center space-x-1.5 bg-indigo-550 hover:bg-indigo-600 text-white font-bold text-xs px-4 py-2 rounded-2xl transition-all shadow-md shadow-indigo-500/10 active:scale-95">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                            <span>Ajouter un produit</span>
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[900px]">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800/50 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                                    <th className="pb-3 w-1/4">Produit <span className="text-rose-500">*</span></th>
                                    <th className="pb-3 px-2 w-28">TVA %</th>
                                    <th className="pb-3 px-2 w-24">Quantité</th>
                                    <th className="pb-3 px-2 w-28">Unité</th>
                                    <th className="pb-3 px-2 w-32">P.U. HT</th>
                                    <th className="pb-3 px-2 w-32">P.U. TTC</th>
                                    <th className="pb-3 px-2 w-24">Remise %</th>
                                    <th className="pb-3 px-2 w-28">RM (Amt)</th>
                                    <th className="pb-3 text-right pr-2">Total HT</th>
                                    <th className="pb-3 w-12 text-center"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/50">
                                {data.lines.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="py-12 text-center text-xs text-slate-400 font-medium">
                                            Aucun produit ajouté. Cliquez sur "Ajouter un produit" pour commencer.
                                        </td>
                                    </tr>
                                ) : data.lines.map((line, idx) => (
                                    <tr key={idx} className="group hover:bg-slate-50/20 dark:hover:bg-slate-850/5 transition-all">
                                        <td className="py-3 pr-2">
                                            <select className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-2 px-3 focus:outline-none focus:border-indigo-500 transition-all font-semibold"
                                                value={line.product_id} onChange={e => updateLineField(idx, 'product_id', e.target.value)} required>
                                                <option value="">Choisir...</option>
                                                {products.map(p => (
                                                    <option key={p.id} value={p.id}>{p.ref ? `[${p.ref}] ` : ''}{p.label} (P.U: {Number(p.sale_price).toFixed(2)})</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="py-3 px-2">
                                            <input type="number" step="0.01" className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-2 px-3 focus:outline-none focus:border-indigo-500 font-semibold"
                                                value={line.tva} onChange={e => updateLineField(idx, 'tva', e.target.value)} required />
                                        </td>
                                        <td className="py-3 px-2">
                                            <input type="number" step="0.0001" className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-2 px-3 focus:outline-none focus:border-indigo-500 font-semibold"
                                                value={line.qty} onChange={e => updateLineField(idx, 'qty', e.target.value)} required />
                                        </td>
                                        <td className="py-3 px-2">
                                            <select className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-2 px-3 focus:outline-none focus:border-indigo-500 transition-all"
                                                value={line.sale_unit_id} onChange={e => updateLineField(idx, 'sale_unit_id', e.target.value)}>
                                                <option value="">Aucune</option>
                                                {units.map(u => (
                                                    <option key={u.id} value={u.id}>{u.label} ({u.code})</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="py-3 px-2">
                                            <input type="number" step="0.0001" className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-2 px-3 focus:outline-none focus:border-indigo-500 font-semibold"
                                                value={line.pu_ht} onChange={e => updateLineField(idx, 'pu_ht', e.target.value)} required />
                                        </td>
                                        <td className="py-3 px-2">
                                            <input type="number" step="0.0001" className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-2 px-3 focus:outline-none focus:border-indigo-500 font-semibold"
                                                value={line.pu_ttc} onChange={e => updateLineField(idx, 'pu_ttc', e.target.value)} required />
                                        </td>
                                        <td className="py-3 px-2">
                                            <input type="number" step="0.01" className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-2 px-3 focus:outline-none focus:border-indigo-500"
                                                value={line.remise} onChange={e => updateLineField(idx, 'remise', e.target.value)} />
                                        </td>
                                        <td className="py-3 px-2">
                                            <input type="number" step="0.0001" className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-2 px-3 focus:outline-none focus:border-indigo-500"
                                                value={line.rm} onChange={e => updateLineField(idx, 'rm', e.target.value)} />
                                        </td>
                                        <td className="py-3 text-right pr-2 font-mono text-xs font-black text-slate-800 dark:text-slate-100 select-none">
                                            {line.total_ht.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-3 text-center">
                                            <button type="button" onClick={() => removeLine(idx)}
                                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-all">
                                                <svg className="h-4 w-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <InputError message={errors.lines} className="mt-2 text-xs" />
                </div>

                {/* Summary & Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl p-6 backdrop-blur-xl h-full flex flex-col justify-between">
                            <div className="space-y-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Remarques / Instructions</span>
                                <p className="text-xs text-slate-450 dark:text-slate-400 leading-relaxed font-medium">
                                    Une fois ce devis enregistré, son statut initial sera défini comme <span className="font-bold text-indigo-500">Brouillon</span>. Vous pourrez ensuite le marquer comme Envoyé, Accepté ou Refusé directement depuis la liste des devis.
                                </p>
                            </div>
                            <div className="flex items-center space-x-3 pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
                                <Link href={route('devis.index')} className="px-5 py-2.5 text-xs font-bold text-slate-650 dark:text-slate-450 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-250 dark:hover:bg-slate-750 transition-all select-none">
                                    Annuler
                                </Link>
                                <button type="submit" disabled={processing || data.lines.length === 0}
                                    className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl active:scale-[0.97] transition-all disabled:opacity-50 select-none">
                                    Enregistrer le Devis
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Summary Totals Cards */}
                    <div className="bg-slate-950 text-slate-100 border border-slate-850 shadow-2xl rounded-3xl p-6 flex flex-col justify-between space-y-6">
                        <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 pb-3 border-b border-slate-800">Récapitulatif Financier</h3>
                        
                        <div className="space-y-4 font-medium text-xs">
                            <div className="flex items-center justify-between text-slate-400">
                                <span>Sous-Total Brut HT</span>
                                <span className="font-mono text-white text-sm font-bold">
                                    {(totalHT + totalRemise).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-rose-400">
                                <span>Total Remise</span>
                                <span className="font-mono text-rose-450 text-sm font-bold">
                                    - {totalRemise.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-slate-400">
                                <span>Total Net HT</span>
                                <span className="font-mono text-white text-sm font-bold">
                                    {totalHT.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-slate-400">
                                <span>Total TVA</span>
                                <span className="font-mono text-white text-sm font-bold">
                                    {totalTVA.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="pt-4 border-t border-slate-850 flex items-center justify-between text-base">
                                <span className="text-indigo-400 font-extrabold">TOTAL TTC</span>
                                <span className="font-mono font-black text-white text-xl">
                                    {totalTTC.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs text-slate-450">{devises.find(d => d.id.toString() === data.devise_id)?.symbol || devises.find(d => d.id.toString() === data.devise_id)?.code || ''}</span>
                                </span>
                            </div>
                        </div>

                        <div className="text-[10px] text-slate-500 font-medium text-center select-none pt-2 border-t border-slate-850">
                            Calculé en temps réel • Arrondi à 4 décimales par ligne
                        </div>
                    </div>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
