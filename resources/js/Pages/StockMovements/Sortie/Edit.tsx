import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState, useRef } from 'react';
import LotAllocationModal from '@/Components/LotAllocationModal';

interface Employee { id: number; first_name: string; last_name: string; }
interface Unit { id: number; code: string; label: string; }
interface Product {
    id: number;
    ref: string;
    label: string;
    manage_by_lot: boolean;
    stock_unit_id: number;
    stock_unit?: Unit;
}
interface Entrepot { id: number; label: string; }

interface LineLot {
    lot_number: string;
    quantity: number;
    fabrication_date?: string | null;
    expiration_date?: string | null;
}

interface Line {
    id: number;
    product_id: number;
    entrepot_id: number;
    qty: number;
    commentaire: string | null;
    lots?: LineLot[];
}

interface SortieStock {
    id: number;
    ref: string;
    date_sortie: string;
    motif: string | null;
    employee_id: number | null;
    status: 'brouillon' | 'valide' | 'annule';
    lines: Line[];
}

export default function Edit({ sortie, products, entrepots, employees, units }: {
    sortie: SortieStock;
    products: Product[];
    entrepots: Entrepot[];
    employees: Employee[];
    units: Unit[];
}) {
    const isLocked = sortie.status !== 'brouillon';

    const { data, setData, put, processing, errors } = useForm({
        date_sortie: sortie.date_sortie,
        motif: sortie.motif || '',
        employee_id: sortie.employee_id ? String(sortie.employee_id) : '',
        lines: sortie.lines.map(line => ({
            product_id: String(line.product_id),
            entrepot_id: String(line.entrepot_id),
            qty: line.qty,
            commentaire: line.commentaire || '',
            lots: line.lots || [] as LineLot[],
        }))
    });

    // Lot Modal States
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

    const addLine = () => {
        if (isLocked) return;
        setData('lines', [
            ...data.lines,
            {
                product_id: '',
                entrepot_id: '',
                qty: 1,
                commentaire: '',
                lots: [] as LineLot[],
            }
        ]);
    };

    const removeLine = (idx: number) => {
        if (isLocked || data.lines.length === 1) return;
        setData('lines', data.lines.filter((_, i) => i !== idx));
    };

    const handleLineChange = (idx: number, field: string, val: any) => {
        if (isLocked) return;
        const linesCopy = [...data.lines] as any;
        linesCopy[idx][field] = val;
        // Reset lots if product, warehouse, or qty changes
        if (field === 'product_id' || field === 'entrepot_id' || field === 'qty') {
            linesCopy[idx]['lots'] = [];
        }
        setData('lines', linesCopy);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isLocked) return;

        // Final verification that all lot-managed products have complete allocations
        for (let i = 0; i < data.lines.length; i++) {
            const line = data.lines[i];
            const prod = products.find(p => String(p.id) === String(line.product_id));
            if (prod?.manage_by_lot) {
                if (!line.lots || line.lots.length === 0) {
                    showToast(`Veuillez allouer des lots pour la ligne n° ${i + 1} (${prod.label}) avant d'enregistrer.`);
                    return;
                }
                const totalAllocated = line.lots.reduce((sum, l) => sum + l.quantity, 0);
                if (Math.abs(totalAllocated - line.qty) > 0.0001) {
                    showToast(`La quantité cumulée des lots (${totalAllocated}) ne correspond pas à la quantité demandée (${line.qty}) pour la ligne n° ${i + 1} (${prod.label}).`);
                    return;
                }
            }
        }

        put(route('sorties-stock.update', sortie.id));
    };

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center space-x-2 text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest max-w-7xl mx-auto">
                <Link href={route('sorties-stock.index')} className="hover:text-slate-600 transition-colors">Sorties de Stock</Link>
                <span>/</span>
                <span className="text-indigo-650 dark:text-indigo-400">Modifier {sortie.ref}</span>
            </div>
        }>
            <Head title={`Modifier la Sortie ${sortie.ref}`} />

            <form onSubmit={handleSubmit} className="max-w-7xl mx-auto space-y-6">
                {/* Header Card */}
                <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-6">
                    <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-5">
                        <div>
                            <div className="flex items-center space-x-2">
                                <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Modifier Sortie : {sortie.ref}</h2>
                                {isLocked && (
                                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-lg text-[9px] font-extrabold uppercase bg-emerald-500/10 text-emerald-650 dark:text-emerald-455 border border-emerald-500/20">Verrouillé</span>
                                )}
                            </div>
                            <p className="text-xs text-slate-455 mt-1 leading-relaxed">Les sorties de stock validées ne peuvent plus être éditées.</p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Link href={route('sorties-stock.index')}
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-455 uppercase tracking-widest mb-1.5 font-black">Magasinier (Employé)</label>
                            <select value={data.employee_id} onChange={e => setData('employee_id', e.target.value)} disabled={isLocked}
                                className="w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50/40 dark:bg-slate-955/40 text-xs font-semibold text-slate-800 dark:text-slate-200 py-3 px-4 focus:outline-none focus:border-indigo-550 transition-all disabled:opacity-55">
                                <option value="">Choisir un magasinier...</option>
                                {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>)}
                            </select>
                            {errors.employee_id && <span className="text-[10px] text-rose-500 font-bold mt-1 block">{errors.employee_id}</span>}
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-455 uppercase tracking-widest mb-1.5 font-black">Date de Sortie <span className="text-rose-500">*</span></label>
                            <input type="date" value={data.date_sortie} onChange={e => setData('date_sortie', e.target.value)} required disabled={isLocked}
                                className="w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50/40 dark:bg-slate-955/40 text-xs font-semibold text-slate-800 dark:text-slate-200 py-3 px-4 focus:outline-none focus:border-indigo-555 transition-all disabled:opacity-55" />
                            {errors.date_sortie && <span className="text-[10px] text-rose-500 font-bold mt-1 block">{errors.date_sortie}</span>}
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-455 uppercase tracking-widest mb-1.5 font-black">Motif (nullable)</label>
                            <input type="text" placeholder="Entrer un motif ou commentaire global..." value={data.motif} onChange={e => setData('motif', e.target.value)} disabled={isLocked}
                                className="w-full rounded-2xl border border-slate-200/85 dark:border-slate-805 bg-slate-50/40 dark:bg-slate-955/40 text-xs font-semibold text-slate-800 dark:text-slate-200 py-3 px-4 focus:outline-none focus:border-indigo-555 transition-all disabled:opacity-55" />
                            {errors.motif && <span className="text-[10px] text-rose-500 font-bold mt-1 block">{errors.motif}</span>}
                        </div>
                    </div>
                </div>

                {/* Lines Card */}
                <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl overflow-hidden backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/20 flex justify-between items-center flex-wrap gap-4">
                        <div>
                            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Lignes de Sortie</h3>
                            <p className="text-[11px] text-slate-455 mt-0.5">Modifier les articles de cette sortie de stock.</p>
                        </div>
                        {!isLocked && (
                            <button type="button" onClick={addLine}
                                className="inline-flex items-center space-x-1.5 text-xs font-bold text-indigo-650 dark:text-indigo-400 hover:text-indigo-700 bg-indigo-500/10 px-4 py-2 rounded-xl transition-all hover:scale-95 active:scale-90">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                                <span>Ajouter une ligne</span>
                            </button>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/40 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 min-w-[220px]">Article</th>
                                    <th className="py-4 px-6 min-w-[150px]">Entrepôt</th>
                                    <th className="py-4 px-6 text-center w-24">Quantité</th>
                                    <th className="py-4 px-6 text-center w-28">Unité</th>
                                    <th className="py-4 px-6 min-w-[220px]">Lots Alloués</th>
                                    <th className="py-4 px-6 min-w-[150px]">Commentaire</th>
                                    {!isLocked && <th className="py-4 px-6 text-center w-12">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/30">
                                {data.lines.map((line, idx) => {
                                    const selectedProd = products.find(p => String(p.id) === String(line.product_id));
                                    const isLotManaged = selectedProd ? selectedProd.manage_by_lot : false;
                                    const allocatedQty = line.lots?.reduce((sum, l) => sum + l.quantity, 0) || 0;

                                    return (
                                        <tr key={idx} className="hover:bg-slate-50/10 dark:hover:bg-slate-955/5">
                                            <td className="py-4 px-6">
                                                <select value={line.product_id} required disabled={isLocked}
                                                    onChange={e => handleLineChange(idx, 'product_id', e.target.value)}
                                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-semibold text-slate-800 dark:text-slate-200 py-2 px-3 focus:outline-none focus:border-indigo-500 transition-all disabled:opacity-55">
                                                    <option value="">Choisir un article...</option>
                                                    {products.map(p => <option key={p.id} value={p.id}>{p.label} ({p.ref})</option>)}
                                                </select>
                                            </td>
                                            <td className="py-4 px-6">
                                                <select value={line.entrepot_id} required disabled={isLocked}
                                                    onChange={e => handleLineChange(idx, 'entrepot_id', e.target.value)}
                                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 text-xs font-semibold text-slate-800 dark:text-slate-200 py-2 px-3 focus:outline-none focus:border-indigo-550 transition-all disabled:opacity-55">
                                                    <option value="">Choisir entrepôt...</option>
                                                    {entrepots.map(ent => <option key={ent.id} value={ent.id}>{ent.label}</option>)}
                                                </select>
                                            </td>
                                            <td className="py-4 px-6">
                                                <input type="number" step="any" min="0.0001" max="9999999999" value={line.qty} required disabled={isLocked}
                                                    onChange={e => handleLineChange(idx, 'qty', Number(e.target.value))}
                                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 text-xs font-bold text-slate-800 dark:text-slate-200 py-2 px-2 text-center focus:outline-none focus:border-indigo-550 transition-all disabled:opacity-55" />
                                            </td>
                                            <td className="py-4 px-6 text-center text-xs font-extrabold text-slate-400 select-none">
                                                {selectedProd ? (selectedProd.stock_unit?.label || selectedProd.stock_unit?.code || '—') : '—'}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                {isLotManaged ? (
                                                    <button type="button" onClick={() => openLotModal(idx)}
                                                        className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-[9px] font-extrabold uppercase tracking-widest transition-all cursor-pointer ${
                                                            Math.abs(allocatedQty - line.qty) < 0.0001
                                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-455 border border-emerald-500/20'
                                                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-455 border border-amber-500/20'
                                                        }`}>
                                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                                        <span>{allocatedQty > 0 ? `${allocatedQty}/${line.qty} alloués` : 'Allouer Lots'}</span>
                                                    </button>
                                                ) : (
                                                    <span className="text-[10px] text-slate-400 font-bold italic select-none">—</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6">
                                                <input type="text" placeholder="Commentaire de ligne..." value={line.commentaire} disabled={isLocked}
                                                    onChange={e => handleLineChange(idx, 'commentaire', e.target.value)}
                                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 text-xs font-semibold text-slate-800 dark:text-slate-200 py-2 px-3 focus:outline-none focus:border-indigo-500 transition-all disabled:opacity-55" />
                                            </td>
                                            {!isLocked && (
                                                <td className="py-4 px-6 text-center">
                                                    <button type="button" onClick={() => removeLine(idx)} disabled={data.lines.length === 1}
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-all disabled:opacity-30">
                                                        <svg className="h-4 w-4 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </form>

            {activeLineIndex !== null && (() => {
                const line = data.lines[activeLineIndex];
                const product = products.find(p => String(p.id) === String(line.product_id));
                return (
                    <LotAllocationModal
                        isOpen={activeLineIndex !== null}
                        onClose={() => setActiveLineIndex(null)}
                        productName={product?.label || ''}
                        productId={line.product_id}
                        entrepotId={line.entrepot_id}
                        requestedQty={line.qty}
                        unitCode={product?.stock_unit?.code || 'U'}
                        initialLots={line.lots || []}
                        allowManualLots={false}
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
                        <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-355 transition-all shrink-0">
                            <svg className="h-4 w-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
