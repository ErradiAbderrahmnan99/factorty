import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState, useRef } from 'react';
import LotAllocationModal from '@/Components/LotAllocationModal';
import { useEntitySettings } from '@/Utils/entitySettings';


interface TauxTva {
    id: number;
    code: string;
    libelle: string;
    taux: number;
    actif: boolean;
}
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

interface Product {
    id: number;
    ref: string;
    label: string;
    manage_by_lot?: boolean;
}

interface RetourAchatLine {
    id: number;
    reception_line_id: number;
    product_id: number;
    entrepot_id: number;
    purchase_unit_id: number | null;
    taux_tva_id?: number | null;
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
    manage_by_lot?: boolean;
    product?: Product;
    purchase_unit?: Unit;
    lots?: Array<{
        lot_number: string;
        quantity: number | string;
        fabrication_date?: string | null;
        expiration_date?: string | null;
    }>;
}

interface RetourAchat {
    id: number;
    ref: string;
    tier_id: number;
    date_retour: string;
    devise_id: number;
    branche_id?: number | null;
    mode_reglement_id: number | string | null;
    condition_reglement_id: number | string | null;
    compte_bancaire_id: number | string | null;
    note_public: string | null;
    note_private: string | null;
    status: 'brouillon' | 'valide' | 'annule';
    total_ht: number;
    total_tva: number;
    total_ttc: number;
    lines: RetourAchatLine[];
    tier?: Tier;
    devise?: Devise;
}

interface OptionItem {
    id: number;
    label: string;
    code?: string;
}

export default function Edit({
    retour,
    tiers,
    devises,
    entrepots,
    modesReglement = [],
    conditionsReglement = [],
    comptesBancaires = [],
    tauxTvas = [],
    branches = []
}: {
    retour: RetourAchat;
    tiers: Tier[];
    devises: Devise[];
    entrepots: Entrepot[];
    modesReglement?: OptionItem[];
    conditionsReglement?: OptionItem[];
    comptesBancaires?: OptionItem[];
    tauxTvas?: TauxTva[];
    branches?: { id: number; name: string; }[];
}) {
    const isLocked = retour.status !== 'brouillon';
    const { decimals, defaultTva, defaultDeviseId, formatMoney, roundMoney } = useEntitySettings();

    const { data, setData, put, processing, errors } = useForm({
        tier_id: String(retour.tier_id),
        date_retour: retour.date_retour,
        devise_id: String(retour.devise_id),
        branche_id: retour.branche_id ? String(retour.branche_id) : '',
        mode_reglement_id: retour.mode_reglement_id ? String(retour.mode_reglement_id) : '',
        condition_reglement_id: retour.condition_reglement_id ? String(retour.condition_reglement_id) : '',
        compte_bancaire_id: retour.compte_bancaire_id ? String(retour.compte_bancaire_id) : '',
        note_public: retour.note_public || '',
        note_private: retour.note_private || '',
        lines: retour.lines.map(line => ({
            id: line.id,
            reception_line_id: line.reception_line_id,
            product_id: line.product_id,
            entrepot_id: line.entrepot_id,
            purchase_unit_id: line.purchase_unit_id,
            tva: (tauxTvas || []).find(t => t.id.toString() === (line.taux_tva_id || '').toString())?.taux || 0,
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
            manage_by_lot: line.product?.manage_by_lot || false,
            lots: (line.lots || []).map((l: any) => ({
                lot_number: l.lot_number,
                quantity: Number(l.quantity),
                fabrication_date: l.fabrication_date,
                expiration_date: l.expiration_date,
            })),
        })),
    });

    const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const toastTimer = useRef<any>(null);

    const showToast = (message: string, type: 'success' | 'error' = 'error') => {
        if (toastTimer.current) clearTimeout(toastTimer.current);
        setToast({ type, message });
        toastTimer.current = setTimeout(() => setToast(null), 5000);
    };

    const openLotModal = (index: number) => {
        const line = data.lines[index];
        if (!line.product_id || !line.entrepot_id) {
            showToast("Veuillez d'abord sélectionner un article et un entrepôt.");
            return;
        }
        setActiveLineIndex(index);
    };

    const handleQtyChange = (idx: number, val: number) => {
        if (isLocked) return;
        const linesCopy = [...data.lines];
        const line = linesCopy[idx];
        
        // Validation: Qty can't exceed remaining quantity (inclusive of current quantity already in return)
        const maxLimit = line.remaining_qty;
        const safeVal = Math.min(val, maxLimit);
        
        linesCopy[idx] = { 
            ...line, 
            qty: Math.max(0.0001, safeVal),
            lots: [] // reset lots on quantity change to force re-allocation
        };
        setData('lines', linesCopy);
    };

    const totalHt = data.lines.reduce((sum, line) => {
        const lineHt = line.qty * line.pu_ht;
        const discount = roundMoney((lineHt * line.remise / 100) + line.rm);
        return sum + roundMoney(Math.max(0, lineHt - discount));
    }, 0);

    const totalTtc = data.lines.reduce((sum, line) => {
        const lineHt = line.qty * line.pu_ht;
        const discount = roundMoney((lineHt * line.remise / 100) + line.rm);
        const lineTotalHt = roundMoney(Math.max(0, lineHt - discount));
        return sum + roundMoney(lineTotalHt * (1 + line.tva / 100));
    }, 0);

    const totalTva = roundMoney(Math.max(0, totalTtc - totalHt));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isLocked) return;

        // Validate lot allocations
        for (let i = 0; i < data.lines.length; i++) {
            const line = data.lines[i];
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

        put(route('retours-achat.update', retour.id));
    };

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center space-x-2 text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest max-w-7xl mx-auto">
                <Link href={route('retours-achat.index')} className="hover:text-slate-600 transition-colors">Retours d'Achat</Link>
                <span>/</span>
                <span className="text-indigo-650 dark:text-indigo-400">Modifier {retour.ref}</span>
            </div>
        }>
            <Head title={`Modifier le Retour d'Achat ${retour.ref}`} />

            <form onSubmit={handleSubmit} className="max-w-7xl mx-auto space-y-6">
                {/* Main Card */}
                <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-6">
                    <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-5">
                        <div>
                            <div className="flex items-center space-x-2">
                                <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Modifier Retour : {retour.ref}</h2>
                                {isLocked && (
                                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-lg text-[9px] font-extrabold uppercase bg-emerald-500/10 text-emerald-655 dark:text-emerald-450 border border-emerald-500/20">Verrouillé</span>
                                )}
                            </div>
                            <p className="text-xs text-slate-450 mt-1 leading-relaxed">Les lignes du retour sont liées aux bons de réception originaux et ne peuvent pas être ajoutées ou supprimées.</p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Link href={route('retours-achat.index')}
                                className="px-5 py-2.5 text-xs font-bold text-slate-655 dark:text-slate-355 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-750 transition-all active:scale-95">
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

                    {/* Metadata lookups */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-455 uppercase tracking-widest mb-1.5 font-bold">Fournisseur</label>
                            <select value={data.tier_id} disabled={true}
                                className="w-full rounded-2xl border border-slate-200/80 bg-slate-100/80 dark:bg-slate-900/80 text-xs font-semibold text-slate-500 py-3 px-4 focus:outline-none transition-all cursor-not-allowed">
                                {tiers.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-455 uppercase tracking-widest mb-1.5 font-bold">Date du Retour</label>
                            <input type="date" value={data.date_retour} onChange={e => setData('date_retour', e.target.value)} disabled={isLocked}
                                className="w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50/40 dark:bg-slate-950/40 text-xs font-semibold text-slate-800 dark:text-slate-200 py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all disabled:opacity-50" />
                            {errors.date_retour && <span className="text-[10px] text-rose-500 font-bold mt-1 block">{errors.date_retour}</span>}
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-455 uppercase tracking-widest mb-1.5 font-bold">Branche <span className="text-rose-500">*</span></label>
                            <select value={data.branche_id} onChange={e => setData('branche_id', e.target.value)} disabled={isLocked} required
                                className="w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50/40 dark:bg-slate-950/40 text-xs font-semibold text-slate-800 dark:text-slate-200 py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all disabled:opacity-50">
                                <option value="">Choisir une branche...</option>
                                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                            {errors.branche_id && <span className="text-[10px] text-rose-500 font-bold mt-1 block">{errors.branche_id}</span>}
                        </div>
                    </div>
                </div>

                {/* Lines of return */}
                <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl overflow-hidden backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/20">
                        <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Articles de retour</h3>
                        <p className="text-[11px] text-slate-450 mt-0.5">Les lignes ci-dessous sont fixes et associées aux bons de réception. Les quantités peuvent être éditées.</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/40 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
                                    <th className="py-4 px-6">Réception Réf</th>
                                    <th className="py-4 px-6">Article</th>
                                    <th className="py-4 px-6 text-center">Quantité Reçue</th>
                                    <th className="py-4 px-6 text-center">Limite de Retour</th>
                                    <th className="py-4 px-6 text-center w-40">Qté Retournée</th>
                                    <th className="py-4 px-6 text-center w-36">Lots Alloués</th>
                                    <th className="py-4 px-6 text-right">P.U. HT</th>
                                    <th className="py-4 px-6 text-right">Total HT</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/30">
                                {data.lines.map((line, idx) => {
                                    const lineHt = line.qty * line.pu_ht;
                                    const discount = roundMoney((lineHt * line.remise / 100) + line.rm);
                                    const lineTotalHt = roundMoney(Math.max(0, lineHt - discount));
                                    const currentDevise = devises.find(d => String(d.id) === data.devise_id);
                                    const symbol = currentDevise ? currentDevise.symbol || currentDevise.code : '';
                                    const allocatedQty = line.lots?.reduce((sum, l) => sum + Number(l.quantity), 0) || 0;

                                    return (
                                        <tr key={line.id} className="hover:bg-slate-50/5 dark:hover:bg-slate-955/5">
                                            <td className="py-4 px-6 text-xs font-black text-slate-500">{line.bl_ref}</td>
                                            <td className="py-4 px-6">
                                                <span className="text-xs font-extrabold text-slate-855 dark:text-white block">{line.label}</span>
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
                                                        className="w-full rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-950 text-xs font-bold text-slate-805 dark:text-slate-200 py-2 px-3 text-center focus:outline-none focus:border-indigo-500 transition-all disabled:opacity-50 disabled:bg-slate-100" />
                                                    {line.qty > line.remaining_qty && (
                                                        <span className="absolute left-0 -bottom-4.5 text-[8px] text-rose-500 font-extrabold uppercase">Limite dépassée!</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                {line.manage_by_lot ? (
                                                    <button type="button"
                                                        onClick={() => openLotModal(idx)}
                                                        className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-[9px] font-extrabold uppercase tracking-widest transition-all cursor-pointer ${
                                                            Math.abs(allocatedQty - line.qty) < 0.0001
                                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/20'
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
                                                {formatMoney(line.pu_ht)} {symbol}
                                            </td>
                                            <td className="py-4 px-6 text-xs text-right font-black text-slate-900 dark:text-white">
                                                {formatMoney(lineTotalHt)} {symbol}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Summary & Totals */}
                <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col md:flex-row md:justify-between items-end gap-6">
                    <div className="text-xs text-slate-450 leading-relaxed max-w-md">
                        <span className="font-extrabold uppercase tracking-widest text-[9px] text-indigo-500 block mb-1">Détails d'Inventaire</span>
                        Les modifications de quantités sont contrôlées et validées par rapport aux restes retournables calculés en temps réel dans notre base de données.
                    </div>
                    
                    <div className="w-full md:w-80 space-y-2.5">
                        <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                            <span>Total HT</span>
                            <span>{formatMoney(totalHt)} {devises.find(d => String(d.id) === data.devise_id)?.code}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-semibold text-slate-500 pb-2 border-b border-slate-200 dark:border-slate-800">
                            <span>TVA cumulée</span>
                            <span>{formatMoney(totalTva)} {devises.find(d => String(d.id) === data.devise_id)?.code}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-black uppercase tracking-widest text-slate-500">Total TTC</span>
                            <span className="text-lg font-black text-indigo-650 dark:text-indigo-400">
                                {formatMoney(totalTtc)} {devises.find(d => String(d.id) === data.devise_id)?.code}
                            </span>
                        </div>
                    </div>
                </div>
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
                        allowManualLots={!isLocked}
                        isLocked={isLocked}
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
                        <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-655 dark:hover:text-slate-355 transition-all shrink-0">
                            <svg className="h-4 w-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
