import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import LotAllocationModal from '@/Components/LotAllocationModal';

interface LineLot {
    lot_number: string;
    quantity: number;
    fabrication_date?: string | null;
    expiration_date?: string | null;
}

interface Tier { id: number; label: string; }
interface Devise { id: number; code: string; symbol: string | null; }
interface Unit { id: number; code: string; label: string; }
interface Entrepot { id: number; label: string; }
interface Employee { id: number; first_name: string; last_name: string; type: string; }

interface Product {
    id: number;
    ref: string;
    label: string;
    sale_unit_id: number;
    stock_unit_id: number;
    manage_by_lot?: boolean;
    stockUnit?: Unit;
    saleUnit?: Unit;
}

interface LivraisonLine {
    id: number;
    livraison_id: number;
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
    returned_qty: number;
    remaining_qty: number;
    product?: Product;
    sale_unit?: Unit;
    lots?: Array<{
        lot_number: string;
        quantity: number | string;
        fabrication_date?: string | null;
        expiration_date?: string | null;
    }>;
}

interface Livraison {
    id: number;
    ref: string;
    tier_id: number;
    commercial: string | null;
    date_livraison: string;
    devise_id: number;
    total_ht: number;
    total_ttc: number;
    lines: LivraisonLine[];
    tier?: Tier;
    devise?: Devise;
}

export default function Create({ tiers, products, devises, units, entrepots, commercials, livraisons }: {
    tiers: Tier[];
    products: Product[];
    devises: Devise[];
    units: Unit[];
    entrepots: Entrepot[];
    commercials: Employee[];
    livraisons: Livraison[];
}) {
    const { data, setData, post, processing, errors } = useForm({
        tier_id: '',
        commercial: '',
        date_retour: new Date().toISOString().split('T')[0],
        devise_id: '',
        lines: [] as Array<{
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
            // metadata for UI
            remaining_qty: number;
            label: string;
            ref: string;
            bl_ref: string;
            manage_by_lot: boolean;
            lots: LineLot[];
        }>,
    });

    const [selectedBlIds, setSelectedBlIds] = useState<number[]>([]);
    const [availableBls, setAvailableBls] = useState<Livraison[]>([]);
    const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);

    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const toastTimer = useRef<any>(null);

    const showToast = (message: string, type: 'success' | 'error' = 'error') => {
        if (toastTimer.current) clearTimeout(toastTimer.current);
        setToast({ type, message });
        toastTimer.current = setTimeout(() => setToast(null), 5000);
    };

    // When client is selected, filter BLs
    useEffect(() => {
        if (!data.tier_id) {
            setAvailableBls([]);
            setSelectedBlIds([]);
            setData(d => ({ ...d, lines: [] }));
            return;
        }

        const filtered = livraisons.filter(bl => bl.tier_id === Number(data.tier_id));
        setAvailableBls(filtered);
        setSelectedBlIds([]);
        setData(d => ({ ...d, lines: [] }));

        // Auto-assign first commercial or first currency if client matches BLs
        if (filtered.length > 0) {
            setData(d => ({
                ...d,
                tier_id: data.tier_id,
                devise_id: String(filtered[0].devise_id),
                commercial: filtered[0].commercial || '',
                lines: [],
            }));
        }
    }, [data.tier_id]);

    // Handle BL selection checkbox
    const handleBlToggle = (blId: number) => {
        let newBlIds = [...selectedBlIds];
        if (newBlIds.includes(blId)) {
            newBlIds = newBlIds.filter(id => id !== blId);
        } else {
            newBlIds.push(blId);
        }
        setSelectedBlIds(newBlIds);

        // Load lines from selected BLs
        const newLines: typeof data.lines = [];
        newBlIds.forEach(id => {
            const bl = availableBls.find(b => b.id === id);
            if (bl) {
                bl.lines.forEach(line => {
                    if (line.remaining_qty > 0) {
                        newLines.push({
                            livraison_line_id: line.id,
                            product_id: line.product_id,
                            entrepot_id: line.entrepot_id,
                            sale_unit_id: line.sale_unit_id,
                            tva: Number(line.tva),
                            qty: line.remaining_qty, // default to return maximum remaining
                            pu_ht: Number(line.pu_ht),
                            pu_ttc: Number(line.pu_ttc),
                            remise: Number(line.remise),
                            rm: Number(line.rm),
                            remaining_qty: line.remaining_qty,
                            label: line.product?.label || 'Produit',
                            ref: line.product?.ref || '',
                            bl_ref: bl.ref,
                            manage_by_lot: line.product?.manage_by_lot || false,
                            lots: (line.lots || []).map((l: any) => ({
                                lot_number: l.lot_number,
                                quantity: Number(l.quantity),
                                fabrication_date: l.fabrication_date,
                                expiration_date: l.expiration_date,
                            })),
                        });
                    }
                });
            }
        });

        setData('lines', newLines);
    };

    // Handle return line checkbox toggle (enable/disable return for this specific item)
    const [checkedLineIds, setCheckedLineIds] = useState<Record<number, boolean>>({});

    useEffect(() => {
        // Automatically check all lines initially when they are added
        const initialChecks: Record<number, boolean> = {};
        data.lines.forEach(line => {
            initialChecks[line.livraison_line_id] = true;
        });
        setCheckedLineIds(initialChecks);
    }, [data.lines.length]);

    const toggleLineCheck = (lineId: number) => {
        setCheckedLineIds(prev => ({
            ...prev,
            [lineId]: !prev[lineId],
        }));
    };

    const handleQtyChange = (idx: number, val: number) => {
        const linesCopy = [...data.lines];
        const line = linesCopy[idx];
        const safeVal = Math.min(val, line.remaining_qty);
        linesCopy[idx] = { 
            ...line, 
            qty: Math.max(0.0001, safeVal),
            lots: [] // reset lots on quantity change to force re-allocation
        };
        setData('lines', linesCopy);
    };

    // Totals calculations forchecked lines
    const getCheckedLines = () => {
        return data.lines.filter(l => checkedLineIds[l.livraison_line_id]);
    };

    const totalHt = getCheckedLines().reduce((sum, line) => {
        const lineHt = line.qty * line.pu_ht;
        const discount = (lineHt * line.remise / 100) + line.rm;
        return sum + Math.max(0, lineHt - discount);
    }, 0);

    const totalTtc = getCheckedLines().reduce((sum, line) => {
        const lineHt = line.qty * line.pu_ht;
        const discount = (lineHt * line.remise / 100) + line.rm;
        const lineTotalHt = Math.max(0, lineHt - discount);
        return sum + (lineTotalHt * (1 + line.tva / 100));
    }, 0);

    const totalTva = Math.max(0, totalTtc - totalHt);

    const openLotModal = (index: number) => {
        const line = data.lines[index];
        if (!line.product_id || !line.entrepot_id) {
            showToast("Veuillez d'abord sélectionner un article et un entrepôt.");
            return;
        }
        setActiveLineIndex(index);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const activeLines = getCheckedLines().map(l => ({
            livraison_line_id: l.livraison_line_id,
            product_id: l.product_id,
            entrepot_id: l.entrepot_id,
            sale_unit_id: l.sale_unit_id,
            tva: l.tva,
            qty: l.qty,
            pu_ht: l.pu_ht,
            pu_ttc: l.pu_ttc,
            remise: l.remise,
            rm: l.rm,
            manage_by_lot: l.manage_by_lot,
            label: l.label,
            lots: l.lots,
        }));

        if (activeLines.length === 0) {
            showToast('Veuillez cocher au moins une ligne de produit à retourner.');
            return;
        }

        // Validate lot allocations
        for (let i = 0; i < activeLines.length; i++) {
            const line = activeLines[i];
            if (line.manage_by_lot) {
                if (!line.lots || line.lots.length === 0) {
                    showToast(`Veuillez allouer les lots pour la ligne n° ${i + 1} (${line.label}) avant d'enregistrer.`);
                    return;
                }
                const totalAllocated = line.lots.reduce((sum, l) => sum + Number(l.quantity), 0);
                if (Math.abs(totalAllocated - line.qty) > 0.0001) {
                    showToast(`La quantité cumulée des lots (${totalAllocated}) ne correspond pas à la quantité demandée (${line.qty}) pour la ligne n° ${i + 1} (${line.label}).`);
                    return;
                }
            }
        }

        router.post(route('retours-vente.store'), {
            ...data,
            lines: activeLines as any,
        });
    };

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center space-x-2 text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest max-w-7xl mx-auto">
                <Link href={route('retours-vente.index')} className="hover:text-slate-600 transition-colors">Retours</Link>
                <span>/</span>
                <span className="text-indigo-650 dark:text-indigo-400">Nouveau Retour</span>
            </div>
        }>
            <Head title="Créer un Retour de Vente" />

            <form onSubmit={handleSubmit} className="max-w-7xl mx-auto space-y-6">
                {/* Main Card */}
                <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-6">
                    <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-5">
                        <div>
                            <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Nouveau Retour de Vente</h2>
                            <p className="text-xs text-slate-450 mt-1 leading-relaxed">Créer un retour et réintégrer le stock à partir des bons de livraison validés.</p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Link href={route('retours-vente.index')}
                                className="px-5 py-2.5 text-xs font-bold text-slate-655 dark:text-slate-355 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 transition-all active:scale-95">
                                Annuler
                            </Link>
                            <button type="submit" disabled={processing}
                                className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl transition-all shadow-md shadow-indigo-500/25 active:scale-95 disabled:opacity-50">
                                Enregistrer le Retour
                            </button>
                        </div>
                    </div>

                    {/* Metadata lookups */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-450 uppercase tracking-widest mb-1.5">Client <span className="text-rose-500">*</span></label>
                            <select value={data.tier_id} onChange={e => setData('tier_id', e.target.value)} required
                                className="w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50/40 dark:bg-slate-950/40 text-xs font-semibold text-slate-800 dark:text-slate-200 py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all">
                                <option value="">Choisir un client...</option>
                                {tiers.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                            </select>
                            {errors.tier_id && <span className="text-[10px] text-rose-500 font-bold mt-1 block">{errors.tier_id}</span>}
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-450 uppercase tracking-widest mb-1.5">Date du Retour <span className="text-rose-500">*</span></label>
                            <input type="date" value={data.date_retour} onChange={e => setData('date_retour', e.target.value)} required
                                className="w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50/40 dark:bg-slate-950/40 text-xs font-semibold text-slate-800 dark:text-slate-200 py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all" />
                            {errors.date_retour && <span className="text-[10px] text-rose-500 font-bold mt-1 block">{errors.date_retour}</span>}
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-450 uppercase tracking-widest mb-1.5">Commercial</label>
                            <select value={data.commercial} onChange={e => setData('commercial', e.target.value)}
                                className="w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50/40 dark:bg-slate-950/40 text-xs font-semibold text-slate-800 dark:text-slate-200 py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all">
                                <option value="">Aucun commercial...</option>
                                {commercials.map(c => <option key={c.id} value={`${c.first_name} ${c.last_name}`}>{c.first_name} {c.last_name}</option>)}
                            </select>
                            {errors.commercial && <span className="text-[10px] text-rose-500 font-bold mt-1 block">{errors.commercial}</span>}
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-450 uppercase tracking-widest mb-1.5">Devise <span className="text-rose-500">*</span></label>
                            <select value={data.devise_id} onChange={e => setData('devise_id', e.target.value)} required
                                className="w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50/40 dark:bg-slate-950/40 text-xs font-semibold text-slate-800 dark:text-slate-200 py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all">
                                <option value="">Choisir une devise...</option>
                                {devises.map(d => <option key={d.id} value={d.id}>{d.code} {d.symbol ? `(${d.symbol})` : ''}</option>)}
                            </select>
                            {errors.devise_id && <span className="text-[10px] text-rose-500 font-bold mt-1 block">{errors.devise_id}</span>}
                        </div>
                    </div>
                </div>

                {/* Step 2: Select BLs */}
                {data.tier_id && (
                    <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
                        <div className="border-b border-slate-100 dark:border-slate-800/60 pb-3">
                            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Sélectionner un ou plusieurs Bons de Livraison</h3>
                            <p className="text-[11px] text-slate-450 mt-0.5">Cochez les BLs desquels vous souhaitez retourner les articles.</p>
                        </div>

                        {availableBls.length === 0 ? (
                            <div className="py-6 text-center text-xs font-semibold text-slate-400">
                                Aucun bon de livraison validé et retournable trouvé pour ce client.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {availableBls.map(bl => {
                                    const isChecked = selectedBlIds.includes(bl.id);
                                    return (
                                        <div key={bl.id} onClick={() => handleBlToggle(bl.id)}
                                            className={`p-4 rounded-2xl border transition-all cursor-pointer select-none relative overflow-hidden flex flex-col justify-between h-28 ${isChecked ? 'border-indigo-500 bg-indigo-50/15 dark:bg-indigo-950/20' : 'border-slate-200 dark:border-slate-800 bg-slate-50/20 hover:bg-slate-50/50 dark:hover:bg-slate-800/20'}`}>
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <span className="text-xs font-black text-slate-850 dark:text-white">{bl.ref}</span>
                                                    <div className="text-[10px] text-slate-450 font-medium mt-1">Date: {bl.date_livraison}</div>
                                                </div>
                                                <input type="checkbox" checked={isChecked} onChange={() => {}}
                                                    className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 h-4.5 w-4.5 cursor-pointer" />
                                            </div>
                                            <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total BL</span>
                                                <span className="text-xs font-extrabold text-slate-850 dark:text-white">
                                                    {Number(bl.total_ttc).toFixed(2)} {bl.devise ? bl.devise.symbol || bl.devise.code : ''}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Step 3: Load and select lines to return */}
                {selectedBlIds.length > 0 && data.lines.length > 0 && (
                    <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl overflow-hidden backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/20">
                            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Sélectionner et Ajuster les quantités à retourner</h3>
                            <p className="text-[11px] text-slate-450 mt-0.5">Cochez les lignes à inclure et saisissez la quantité. Celle-ci ne peut dépasser le reste à retourner.</p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/40 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
                                        <th className="py-4 px-6 text-center w-12">Cocher</th>
                                        <th className="py-4 px-6">BL Réf</th>
                                        <th className="py-4 px-6">Article</th>
                                        <th className="py-4 px-6 text-center">Reste à Retourner</th>
                                        <th className="py-4 px-6 text-center w-40">Qté Retournée</th>
                                        <th className="py-4 px-6 text-center w-36">Lots Alloués</th>
                                        <th className="py-4 px-6 text-right">P.U. HT</th>
                                        <th className="py-4 px-6 text-right">Total HT</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/30">
                                    {data.lines.map((line, idx) => {
                                        const isChecked = !!checkedLineIds[line.livraison_line_id];
                                        const lineHt = line.qty * line.pu_ht;
                                        const discount = (lineHt * line.remise / 100) + line.rm;
                                        const lineTotalHt = Math.max(0, lineHt - discount);
                                        const currentDevise = devises.find(d => String(d.id) === data.devise_id);
                                        const symbol = currentDevise ? currentDevise.symbol || currentDevise.code : '';
                                        const allocatedQty = line.lots?.reduce((sum, l) => sum + Number(l.quantity), 0) || 0;

                                        return (
                                            <tr key={line.livraison_line_id} className={`transition-colors ${isChecked ? 'bg-indigo-50/5 dark:bg-indigo-950/5' : 'opacity-60 bg-transparent'}`}>
                                                <td className="py-4 px-6 text-center">
                                                    <input type="checkbox" checked={isChecked} onChange={() => toggleLineCheck(line.livraison_line_id)}
                                                        className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 h-4.5 w-4.5 cursor-pointer" />
                                                </td>
                                                <td className="py-4 px-6 text-xs font-black text-slate-500">{line.bl_ref}</td>
                                                <td className="py-4 px-6">
                                                    <span className="text-xs font-extrabold text-slate-850 dark:text-white block">{line.label}</span>
                                                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5 block">{line.ref}</span>
                                                </td>
                                                <td className="py-4 px-6 text-xs text-center font-bold text-slate-655">
                                                    {line.remaining_qty.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="relative">
                                                        <input type="number" step="any" min="0.0001" max={line.remaining_qty}
                                                            value={line.qty} disabled={!isChecked}
                                                            onChange={e => handleQtyChange(idx, Number(e.target.value))}
                                                            className="w-full rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-955 text-xs font-bold text-slate-800 dark:text-slate-200 py-2 px-3 text-center focus:outline-none focus:border-indigo-500 transition-all disabled:opacity-50 disabled:bg-slate-100" />
                                                        {line.qty > line.remaining_qty && (
                                                            <span className="absolute left-0 -bottom-4.5 text-[8px] text-rose-500 font-extrabold uppercase">Limite dépassée!</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    {line.manage_by_lot ? (
                                                        <button type="button" disabled={!isChecked}
                                                            onClick={() => openLotModal(idx)}
                                                            className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-[9px] font-extrabold uppercase tracking-widest transition-all cursor-pointer ${
                                                                !isChecked
                                                                    ? 'opacity-40 cursor-not-allowed bg-slate-150 text-slate-400 border border-slate-200'
                                                                    : Math.abs(allocatedQty - line.qty) < 0.0001
                                                                        ? 'bg-emerald-500/10 text-emerald-650 dark:text-emerald-450 border border-emerald-500/20'
                                                                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-450 border border-amber-500/20'
                                                            }`}>
                                                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                                            <span>{allocatedQty > 0 ? `${allocatedQty}/${line.qty} alloués` : 'Allouer Lots'}</span>
                                                        </button>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-400 font-bold italic select-none">—</span>
                                                    )}
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
                                <span className="font-extrabold uppercase tracking-widest text-[9px] text-indigo-500 block mb-1">Règles de Retour</span>
                                Le stock correspondant sera réinjecté dans l'entrepôt configuré à l'origine du bon de livraison lors de la validation du statut.
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
                                    <span className="text-lg font-black text-indigo-650 dark:text-indigo-400">
                                        {totalTtc.toFixed(2)} {devises.find(d => String(d.id) === data.devise_id)?.code}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </form>
            {activeLineIndex !== null && (() => {
                const line = data.lines[activeLineIndex];
                return (
                    <LotAllocationModal
                        isOpen={activeLineIndex !== null}
                        onClose={() => setActiveLineIndex(null)}
                        productName={line.label || ''}
                        productId={line.product_id}
                        entrepotId={line.entrepot_id}
                        requestedQty={line.qty}
                        unitCode="U"
                        initialLots={line.lots || []}
                        allowManualLots={true}
                        onConfirm={(allocatedLots) => {
                            const updated = [...data.lines];
                            updated[activeLineIndex].lots = allocatedLots as any[];
                            setData('lines', updated);
                            setActiveLineIndex(null);
                        }}
                    />
                );
            })()}
            {/* Toast */}
            {toast && (
                <div className="fixed top-5 right-5 z-[100] max-w-sm w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[2rem] shadow-3xl p-4 animate-slide-in backdrop-blur-xl">
                    <div className="flex items-start space-x-3.5">
                        <div className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 ${toast.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-455 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border border-rose-500/20'}`}>
                            {toast.type === 'success' ? (
                                <svg className="h-5 w-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            ) : (
                                <svg className="h-5 w-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-855 dark:text-white">{toast.type === 'success' ? 'Succès' : 'Erreur'}</h4>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-455 mt-1 leading-relaxed">{toast.message}</p>
                        </div>
                        <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-355 transition-all shrink-0">
                            <svg className="h-4 w-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
