import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

interface Tier { id: number; label: string; }
interface Devise { id: number; code: string; symbol: string | null; }
interface Unit { id: number; code: string; label: string; }
interface Entrepot { id: number; label: string; }
interface Employee { id: number; first_name: string; last_name: string; type: string; }

interface Product {
    id: number;
    ref: string;
    label: string;
}

interface RetourVenteLine {
    id: number;
    livraison_line_id: number;
    product_id: number;
    entrepot_id: number;
    sale_unit_id: number | null;
    tva: number;
    qty: number;
    pu_ht: number;
    pu_ttc: number;
    remise: number;
    rm: number;
    total_ht: number;
    total_ttc: number;
    remaining_qty: number;
    original_bl_qty: number;
    bl_ref: string;
    product?: Product;
    sale_unit?: Unit;
}

interface RetourVente {
    id: number;
    ref: string;
    tier_id: number;
    commercial: string | null;
    date_retour: string;
    devise_id: number;
    status: 'brouillon' | 'valide' | 'annule';
    total_ht: number;
    total_tva: number;
    total_ttc: number;
    lines: RetourVenteLine[];
    tier?: Tier;
    devise?: Devise;
}

export default function Edit({ retour, tiers, devises, entrepots, commercials }: {
    retour: RetourVente;
    tiers: Tier[];
    devises: Devise[];
    entrepots: Entrepot[];
    commercials: Employee[];
}) {
    const isLocked = retour.status !== 'brouillon';

    const { data, setData, put, processing, errors } = useForm({
        tier_id: String(retour.tier_id),
        commercial: retour.commercial || '',
        date_retour: retour.date_retour,
        devise_id: String(retour.devise_id),
        lines: retour.lines.map(line => ({
            id: line.id,
            livraison_line_id: line.livraison_line_id,
            product_id: line.product_id,
            entrepot_id: line.entrepot_id,
            sale_unit_id: line.sale_unit_id,
            tva: Number(line.tva),
            qty: Number(line.qty),
            pu_ht: Number(line.pu_ht),
            pu_ttc: Number(line.pu_ttc),
            remise: Number(line.remise),
            rm: Number(line.rm),
            remaining_qty: Number(line.remaining_qty),
            original_bl_qty: Number(line.original_bl_qty),
            label: line.product?.label || 'Produit',
            ref: line.product?.ref || '',
            bl_ref: line.bl_ref,
        })),
    });

    const handleQtyChange = (idx: number, val: number) => {
        if (isLocked) return;
        const linesCopy = [...data.lines];
        const line = linesCopy[idx];
        
        // Validation: Qty can't exceed remaining quantity (inclusive of current quantity already in return)
        const maxLimit = line.remaining_qty;
        const safeVal = Math.min(val, maxLimit);
        
        linesCopy[idx] = { ...line, qty: Math.max(0.0001, safeVal) };
        setData('lines', linesCopy);
    };

    const totalHt = data.lines.reduce((sum, line) => {
        const lineHt = line.qty * line.pu_ht;
        const discount = (lineHt * line.remise / 100) + line.rm;
        return sum + Math.max(0, lineHt - discount);
    }, 0);

    const totalTtc = data.lines.reduce((sum, line) => {
        const lineHt = line.qty * line.pu_ht;
        const discount = (lineHt * line.remise / 100) + line.rm;
        const lineTotalHt = Math.max(0, lineHt - discount);
        return sum + (lineTotalHt * (1 + line.tva / 100));
    }, 0);

    const totalTva = Math.max(0, totalTtc - totalHt);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isLocked) return;

        put(route('retours-vente.update', retour.id));
    };

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center space-x-2 text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest max-w-7xl mx-auto">
                <Link href={route('retours-vente.index')} className="hover:text-slate-600 transition-colors">Retours</Link>
                <span>/</span>
                <span className="text-indigo-650 dark:text-indigo-400">Modifier {retour.ref}</span>
            </div>
        }>
            <Head title={`Modifier le Retour ${retour.ref}`} />

            <form onSubmit={handleSubmit} className="max-w-7xl mx-auto space-y-6">
                {/* Main Card */}
                <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 backdrop-blur-xl shadow-2xl space-y-6">
                    <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-5">
                        <div>
                            <div className="flex items-center space-x-2">
                                <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Modifier Retour : {retour.ref}</h2>
                                {isLocked && (
                                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-lg text-[9px] font-extrabold uppercase bg-emerald-500/10 text-emerald-650 dark:text-emerald-450 border border-emerald-500/20">Verrouillé</span>
                                )}
                            </div>
                            <p className="text-xs text-slate-450 mt-1 leading-relaxed">Les lignes du retour sont liées aux BL originaux et ne peuvent pas être ajoutées ou supprimées.</p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Link href={route('retours-vente.index')}
                                className="px-5 py-2.5 text-xs font-bold text-slate-655 dark:text-slate-355 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 transition-all active:scale-95">
                                Retour
                            </Link>
                            {!isLocked && (
                                <button type="submit" disabled={processing}
                                    className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl transition-all shadow-md shadow-indigo-500/25 active:scale-95 disabled:opacity-50">
                                    Mettre à jour
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Metadata lookups - Locked */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-450 uppercase tracking-widest mb-1.5 font-black">Client</label>
                            <select value={data.tier_id} disabled={true}
                                className="w-full rounded-2xl border border-slate-200/80 bg-slate-100/80 dark:bg-slate-900/80 text-xs font-semibold text-slate-500 py-3 px-4 focus:outline-none transition-all cursor-not-allowed">
                                {tiers.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-450 uppercase tracking-widest mb-1.5 font-black">Date du Retour</label>
                            <input type="date" value={data.date_retour} onChange={e => setData('date_retour', e.target.value)} disabled={isLocked}
                                className="w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50/40 dark:bg-slate-950/40 text-xs font-semibold text-slate-800 dark:text-slate-200 py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all disabled:opacity-50" />
                            {errors.date_retour && <span className="text-[10px] text-rose-500 font-bold mt-1 block">{errors.date_retour}</span>}
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-450 uppercase tracking-widest mb-1.5 font-black">Commercial</label>
                            <select value={data.commercial} onChange={e => setData('commercial', e.target.value)} disabled={isLocked}
                                className="w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50/40 dark:bg-slate-950/40 text-xs font-semibold text-slate-800 dark:text-slate-200 py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all disabled:opacity-50">
                                <option value="">Aucun commercial...</option>
                                {commercials.map(c => <option key={c.id} value={`${c.first_name} ${c.last_name}`}>{c.first_name} {c.last_name}</option>)}
                            </select>
                            {errors.commercial && <span className="text-[10px] text-rose-500 font-bold mt-1 block">{errors.commercial}</span>}
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-450 uppercase tracking-widest mb-1.5 font-black">Devise</label>
                            <select value={data.devise_id} disabled={true}
                                className="w-full rounded-2xl border border-slate-200/80 bg-slate-100/80 dark:bg-slate-900/80 text-xs font-semibold text-slate-500 py-3 px-4 focus:outline-none transition-all cursor-not-allowed">
                                {devises.map(d => <option key={d.id} value={d.id}>{d.code}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Lines of return */}
                <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl overflow-hidden backdrop-blur-xl shadow-xl">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/20">
                        <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Articles de retour</h3>
                        <p className="text-[11px] text-slate-450 mt-0.5">Les lignes ci-dessous sont fixes et associées aux BLs. Les quantités peuvent être éditées.</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/40 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
                                    <th className="py-4 px-6">BL Réf</th>
                                    <th className="py-4 px-6">Article</th>
                                    <th className="py-4 px-6 text-center">Quantité Livrée</th>
                                    <th className="py-4 px-6 text-center">Limite de Retour</th>
                                    <th className="py-4 px-6 text-center w-40">Qté Retournée</th>
                                    <th className="py-4 px-6 text-right">P.U. HT</th>
                                    <th className="py-4 px-6 text-right">Total HT</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/30">
                                {data.lines.map((line, idx) => {
                                    const lineHt = line.qty * line.pu_ht;
                                    const discount = (lineHt * line.remise / 100) + line.rm;
                                    const lineTotalHt = Math.max(0, lineHt - discount);
                                    const currentDevise = devises.find(d => String(d.id) === data.devise_id);
                                    const symbol = currentDevise ? currentDevise.symbol || currentDevise.code : '';

                                    return (
                                        <tr key={line.id} className="hover:bg-slate-50/5 dark:hover:bg-slate-950/5">
                                            <td className="py-4 px-6 text-xs font-black text-slate-500">{line.bl_ref}</td>
                                            <td className="py-4 px-6">
                                                <span className="text-xs font-extrabold text-slate-850 dark:text-white block">{line.label}</span>
                                                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5 block">{line.ref}</span>
                                            </td>
                                            <td className="py-4 px-6 text-xs text-center font-bold text-slate-450">
                                                {line.original_bl_qty.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })}
                                            </td>
                                            <td className="py-4 px-6 text-xs text-center font-extrabold text-emerald-600">
                                                {line.remaining_qty.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })}
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="relative">
                                                    <input type="number" step="any" min="0.0001" max={line.remaining_qty}
                                                        value={line.qty} disabled={isLocked}
                                                        onChange={e => handleQtyChange(idx, Number(e.target.value))}
                                                        className="w-full rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-950 text-xs font-bold text-slate-800 dark:text-slate-200 py-2 px-3 text-center focus:outline-none focus:border-indigo-500 transition-all disabled:opacity-50 disabled:bg-slate-100" />
                                                    {line.qty > line.remaining_qty && (
                                                        <span className="absolute left-0 -bottom-4.5 text-[8px] text-rose-500 font-extrabold uppercase">Limite dépassée!</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-xs text-right font-semibold text-slate-700 dark:text-slate-300">
                                                {line.pu_ht.toFixed(2)} {symbol}
                                            </td>
                                            <td className="py-4 px-6 text-xs text-right font-black text-slate-900 dark:text-white">
                                                {lineTotalHt.toFixed(2)} {symbol}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary & Totals */}
                    <div className="p-6 bg-slate-50/50 dark:bg-slate-950/10 border-t border-slate-100 dark:border-slate-800/60 flex flex-col md:flex-row md:justify-between items-end gap-6">
                        <div className="text-xs text-slate-450 leading-relaxed max-w-md">
                            <span className="font-extrabold uppercase tracking-widest text-[9px] text-indigo-500 block mb-1">Détails d'Inventaire</span>
                            Les modifications de quantités sont contrôlées et validées par rapport aux restes retournables calculés en temps réel dans notre base de données.
                        </div>
                        
                        <div className="w-full md:w-80 space-y-2.5">
                            <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                                <span>Total HT</span>
                                <span>{totalHt.toFixed(2)} {devises.find(d => String(d.id) === data.devise_id)?.code}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-semibold text-slate-500 pb-2 border-b border-slate-200 dark:border-slate-800">
                                <span>TVA cumulée</span>
                                <span>{totalTva.toFixed(2)} {devises.find(d => String(d.id) === data.devise_id)?.code}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-black uppercase tracking-widest text-slate-500">Total TTC</span>
                                <span className="text-lg font-black text-indigo-655 dark:text-indigo-400">
                                    {totalTtc.toFixed(2)} {devises.find(d => String(d.id) === data.devise_id)?.code}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
