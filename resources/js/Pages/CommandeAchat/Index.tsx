import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import LotAllocationModal from '@/Components/LotAllocationModal';
import DecimalInput from '@/Components/DecimalInput';
import { useEntitySettings } from '@/Utils/entitySettings';

interface Tier { id: number; label: string; }
interface Devise { id: number; code: string; symbol: string | null; }

interface Unit {
    id: number;
    code: string;
    label: string;
    ratio: number;
    unit_category_id: number | null;
}

interface Product {
    id: number;
    ref: string | null;
    label: string;
    purchase_price: number;
    purchase_unit_id: number | null;
    manage_by_lot: boolean;
    stock_unit?: Unit;
    purchase_unit?: Unit;
    unit_category_id: number | null;
}

interface Entrepot {
    id: number;
    code: string;
    label: string;
}

interface CloneLineLot {
    lot_number: string;
    quantity: number;
    fabrication_date?: string | null;
    expiration_date?: string | null;
}

interface CloneLineItem {
    commande_achat_line_id: string | number;
    product_id: string;
    qty: number | string;
    original_qty: number;
    qty_receptionnee: number;
    purchase_unit_id: string | null;
    tva: number;
    pu_ht: number;
    pu_ttc: number;
    remise: number;
    rm: number;
    total_ht: number;
    total_ttc: number;
    entrepot_id: string;
    lots: CloneLineLot[];
    product?: any;
    purchase_unit?: any;
}

interface CloneForm {
    tier_id: string;
    date_reception: string;
    devise_id: string;
    branche_id: string;
    commande_achat_id: string;
    note_public: string;
    note_private: string;
    lines: CloneLineItem[];
}

interface CommandeAchat {
    id: number;
    ref: string;
    tier: Tier;
    date_commande: string;
    date_livraison: string | null;
    total_ht: number;
    total_ttc: number;
    status: 'brouillon' | 'commandee' | 'recue' | 'recue partiellement' | 'annulee';
    devise: Devise;
    receptions?: { id: number; ref: string }[];
    branche?: { id: number; name: string };
}

interface PaginationLink { url: string | null; label: string; active: boolean; }

interface PaginatedCommandes {
    data: CommandeAchat[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLink[];
}

const STATUS_STYLING: Record<string, {badge: string; dot: string; label: string}> = {
    'brouillon': { badge: 'bg-slate-500/10 text-slate-650 dark:text-slate-400 border-slate-500/20',   dot: 'bg-slate-500',   label: 'Brouillon' },
    'commandee': { badge: 'bg-emerald-500/10 text-emerald-650 dark:text-emerald-450 border-emerald-500/20', dot: 'bg-emerald-500', label: 'Validé' },
    'annulee':   { badge: 'bg-rose-500/10 text-rose-650 dark:text-rose-455 border-rose-500/20',        dot: 'bg-rose-500',   label: 'Annulé' },
    'recue':     { badge: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20', dot: 'bg-violet-500', label: 'Reçu' },
    'recue partiellement': { badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', dot: 'bg-blue-500', label: 'Partiellement Reçu' }
};

export default function Index({
    commandes,
    filters,
    products = [],
    entrepots = [],
    units = []
}: {
    commandes: PaginatedCommandes;
    filters: { search: string | null; status: string | null };
    products?: Product[];
    entrepots?: Entrepot[];
    units?: Unit[];
}) {
    const { decimals } = useEntitySettings();
    const { flash } = usePage().props as any;
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [statusTarget, setStatusTarget] = useState<CommandeAchat | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<CommandeAchat | null>(null);
    const [localFlash, setLocalFlash] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (flash?.success) {
            setLocalFlash({ type: 'success', message: flash.success });
            setStatusTarget(null);
            const t = setTimeout(() => setLocalFlash(null), 5000);
            return () => clearTimeout(t);
        } else if (flash?.error) {
            setLocalFlash({ type: 'error', message: flash.error });
            setStatusTarget(null);
            const t = setTimeout(() => setLocalFlash(null), 7000);
            return () => clearTimeout(t);
        }
    }, [flash]);

    useEffect(() => {
        if (isFirstRender.current) { isFirstRender.current = false; return; }
        const delay = setTimeout(() => {
            router.get(route('commandes-achat.index'), { search: search || undefined, status: statusFilter || undefined }, { preserveState: true, replace: true });
        }, 300);
        return () => clearTimeout(delay);
    }, [search, statusFilter]);

    const changeStatus = (id: number, newStatus: string) => {
        router.post(route('commandes-achat.toggle-status', id), { status: newStatus }, {
            onSuccess: () => setStatusTarget(null),
            preserveScroll: true,
        });
    };

    const [cloneTarget, setCloneTarget] = useState<CommandeAchat | null>(null);
    const [cloneForm, setCloneForm] = useState<CloneForm | null>(null);
    const [isSubmittingClone, setIsSubmittingClone] = useState(false);
    const [cloneErrors, setCloneErrors] = useState<Record<string, string>>({});
    const [activeCloneLineIndex, setActiveCloneLineIndex] = useState<number | null>(null);

    const startCloning = async (commande: CommandeAchat) => {
        try {
            const response = await axios.get(route('api.commandes-achat.show', commande.id));
            const data = response.data;
            setCloneTarget(data);
            setCloneForm({
                tier_id: data.tier_id.toString(),
                date_reception: new Date().toISOString().split('T')[0],
                devise_id: data.devise_id.toString(),
                branche_id: data.branche_id ? data.branche_id.toString() : '',
                commande_achat_id: data.id.toString(),
                note_public: data.note_public || '',
                note_private: data.note_private || '',
                lines: data.lines
                    .filter((line: any) => {
                        const remaining = Number(line.qty) - (Number(line.qty_receptionnee) || 0);
                        return remaining > 0;
                    })
                    .map((line: any) => {
                        const qty = Number(line.qty) - (Number(line.qty_receptionnee) || 0);
                        const pu_ht = Number(line.pu_ht);
                        const tva = Number(line.tva) || 20.00;
                        const remise = Number(line.remise) || 0;
                        const rm = Number(line.rm) || 0;
                        const lineHt = qty * pu_ht;
                        const discount = (lineHt * remise / 100) + rm;
                        const total_ht = Math.max(0, lineHt - discount);
                        const total_ttc = total_ht * (1 + tva / 100);

                        return {
                            commande_achat_line_id: line.id,
                            product_id: line.product_id.toString(),
                            qty: qty,
                            original_qty: Number(line.qty),
                            qty_receptionnee: Number(line.qty_receptionnee) || 0,
                            purchase_unit_id: line.purchase_unit_id ? line.purchase_unit_id.toString() : '',
                            tva: tva,
                            pu_ht: pu_ht,
                            pu_ttc: Number(line.pu_ttc),
                            remise: remise,
                            rm: rm,
                            total_ht: total_ht,
                            total_ttc: total_ttc,
                            entrepot_id: line.entrepot_id ? line.entrepot_id.toString() : (entrepots.length > 0 ? entrepots[0].id.toString() : ''),
                            lots: [],
                            product: line.product,
                            purchase_unit: line.purchase_unit
                        };
                    })
            });
        } catch (error) {
            console.error("Error fetching purchase order details for conversion", error);
            alert("Erreur lors de la récupération des détails de la commande.");
        }
    };

    const handleCloneLineQtyChange = (idx: number, val: number) => {
        if (!cloneForm) return;
        const updated = [...cloneForm.lines];
        const line = updated[idx];
        
        const lineHt = val * line.pu_ht;
        const discount = (lineHt * line.remise / 100) + line.rm;
        const total_ht = Math.max(0, lineHt - discount);
        const total_ttc = total_ht * (1 + line.tva / 100);

        updated[idx] = {
            ...line,
            qty: val,
            total_ht,
            total_ttc,
            lots: [] // Clear lots to force re-allocation
        };

        setCloneForm({ ...cloneForm, lines: updated });
    };

    const handleCloneLinePuHtChange = (idx: number, val: number) => {
        if (!cloneForm) return;
        const updated = [...cloneForm.lines];
        const pu_ht = Math.max(0, val);
        const line = updated[idx];

        const lineHt = (Number(line.qty) || 0) * pu_ht;
        const discount = (lineHt * line.remise / 100) + line.rm;
        const total_ht = Math.max(0, lineHt - discount);
        const total_ttc = total_ht * (1 + line.tva / 100);

        updated[idx] = {
            ...line,
            pu_ht,
            total_ht,
            total_ttc
        };

        setCloneForm({ ...cloneForm, lines: updated });
    };

    const handleCloneLineWarehouseChange = (idx: number, val: string) => {
        if (!cloneForm) return;
        const updated = [...cloneForm.lines];
        updated[idx] = {
            ...updated[idx],
            entrepot_id: val,
            lots: [] // Clear lots to force re-allocation for new warehouse
        };
        setCloneForm({ ...cloneForm, lines: updated });
    };

    const handleAddProductToClone = (prod: any) => {
        if (!cloneForm) return;
        const newLine: CloneLineItem = {
            commande_achat_line_id: '',
            product_id: prod.id.toString(),
            qty: 1,
            original_qty: 0,
            qty_receptionnee: 0,
            purchase_unit_id: prod.purchase_unit_id ? prod.purchase_unit_id.toString() : '',
            tva: 20.00,
            pu_ht: Number(prod.purchase_price || 0),
            pu_ttc: Number(prod.purchase_price || 0) * 1.20,
            remise: 0,
            rm: 0,
            total_ht: Number(prod.purchase_price || 0),
            total_ttc: Number(prod.purchase_price || 0) * 1.20,
            entrepot_id: entrepots.length > 0 ? entrepots[0].id.toString() : '',
            lots: [],
            product: {
                id: prod.id,
                label: prod.label,
                ref: prod.ref,
                manage_by_lot: !!prod.manage_by_lot,
                stock_unit: prod.stock_unit,
                purchase_unit: prod.purchase_unit
            },
            purchase_unit: prod.purchase_unit
        };

        setCloneForm({
            ...cloneForm,
            lines: [...cloneForm.lines, newLine]
        });
    };

    const handleRemoveCloneLine = (idx: number) => {
        if (!cloneForm) return;
        const updated = cloneForm.lines.filter((_, i) => i !== idx);
        setCloneForm({ ...cloneForm, lines: updated });
    };

    const submitClone = (e: React.FormEvent) => {
        e.preventDefault();
        if (!cloneForm) return;

        const missingWarehouse = cloneForm.lines.some(l => !l.entrepot_id);
        if (missingWarehouse) {
            alert("Veuillez sélectionner un entrepôt pour toutes les lignes.");
            return;
        }

        for (let i = 0; i < cloneForm.lines.length; i++) {
            const line = cloneForm.lines[i];
            const qty = Number(line.qty) || 0;
            if (qty <= 0) {
                alert(`Veuillez saisir une quantité supérieure à 0 pour la ligne n° ${i + 1}.`);
                return;
            }
            if (line.product?.manage_by_lot) {
                const stockUnit = line.product.stock_unit;
                const lineUnit = line.purchase_unit || line.product.purchase_unit;
                
                let requestedQty = qty;
                if (stockUnit && lineUnit && lineUnit.id !== stockUnit.id) {
                    const ratioLine = Number(lineUnit.ratio) || 1.0;
                    const ratioStock = Number(stockUnit.ratio) || 1.0;
                    if (ratioStock > 0) {
                        requestedQty = qty * (ratioLine / ratioStock);
                    }
                }

                const allocated = line.lots.reduce((sum, l) => sum + l.quantity, 0);
                if (Math.abs(allocated - requestedQty) > 0.0001) {
                    alert(`Veuillez allouer les lots pour la ligne n° ${i + 1} (${line.product.label}) avant d'enregistrer.`);
                    return;
                }
            }
        }

        setIsSubmittingClone(true);
        setCloneErrors({});

        router.post(route('receptions.store'), cloneForm as any, {
            onSuccess: () => {
                setCloneForm(null);
                setCloneTarget(null);
            },
            onError: (errs) => {
                setCloneErrors(errs);
            },
            onFinish: () => {
                setIsSubmittingClone(false);
            }
        });
    };

    return (
        <AuthenticatedLayout header={
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 max-w-7xl mx-auto">
                <div>
                    <div className="flex items-center space-x-2 text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        <span>Achats</span><span>/</span>
                        <span className="text-indigo-650 dark:text-indigo-400">Commandes d'Achat</span>
                    </div>
                    <div className="flex items-center mt-1.5 flex-wrap gap-3">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Commandes Achat</h2>
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border-indigo-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                            <span>{commandes.total} au total</span>
                        </span>
                    </div>
                </div>
                <Link href={route('commandes-achat.create')}
                    className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-3 rounded-2xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                    <span>Nouvelle Commande</span>
                </Link>
            </div>
        }>
            <Head title="Commandes d'Achat" />

            <div className="max-w-7xl mx-auto space-y-5">
                {/* Filters */}
                <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-5 backdrop-blur-xl flex flex-wrap gap-4 items-center">
                    <div className="relative flex-1 min-w-[200px]">
                        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input type="text" placeholder="Rechercher par référence, fournisseur..." value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition-all" />
                    </div>
                    <select className="rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs font-semibold text-slate-800 dark:text-slate-200 py-2.5 px-4 focus:outline-none focus:border-indigo-500 transition-all"
                        value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="">Tous les statuts</option>
                        <option value="brouillon">Brouillon</option>
                        <option value="commandee">Validé</option>
                        <option value="recue">Reçu</option>
                        <option value="recue partiellement">Partiellement Reçu</option>
                        <option value="annulee">Annulé</option>
                    </select>
                </div>

                {/* Table */}
                <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.03)] rounded-3xl overflow-hidden backdrop-blur-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100/80 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                                    <th className="py-4 px-6">Référence</th>
                                    <th className="py-4 px-6">Fournisseur</th>
                                    <th className="py-4 px-6">Date Commande</th>
                                    <th className="py-4 px-6">Livraison Prévue</th>
                                    <th className="py-4 px-6 text-right">Total HT</th>
                                    <th className="py-4 px-6 text-right">Total TTC</th>
                                    <th className="py-4 px-6 text-center">Statut</th>
                                    <th className="py-4 px-6 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/30">
                                {commandes.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-12 text-center text-xs font-semibold text-slate-400">
                                            Aucune commande trouvée.
                                         </td>
                                    </tr>
                                ) : commandes.data.map(item => {
                                    const styling = STATUS_STYLING[item.status] || STATUS_STYLING.brouillon;
                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/5 transition-colors">
                                            <td className="py-4 px-6 text-xs font-black text-slate-800 dark:text-slate-200">
                                                {item.ref}
                                                {item.receptions && item.receptions.length > 0 && (
                                                    <div className="mt-1 flex flex-col space-y-0.5">
                                                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Bons de Réception liés :</span>
                                                        {item.receptions.map(br => (
                                                            <a key={br.id} href={`/receptions`}
                                                                className="text-[9px] font-extrabold text-violet-500 hover:text-violet-750 hover:underline block"
                                                                title={`Voir le BR ${br.ref}`}
                                                            >
                                                                {br.ref}
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.tier ? item.tier.label : '—'}</div>
                                            </td>
                                            <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400 font-medium">{item.date_commande}</td>
                                            <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400 font-medium">{item.date_livraison || '—'}</td>
                                            <td className="py-4 px-6 text-xs font-bold text-slate-700 dark:text-slate-350 text-right">
                                                {item.total_ht.toFixed(decimals)} {item.devise ? item.devise.symbol || item.devise.code : ''}
                                            </td>
                                            <td className="py-4 px-6 text-xs font-extrabold text-slate-900 dark:text-white text-right">
                                                {item.total_ttc.toFixed(decimals)} {item.devise ? item.devise.symbol || item.devise.code : ''}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <button onClick={() => setStatusTarget(item)}
                                                    className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider transition-all cursor-pointer active:scale-95 border ${styling.badge}`}>
                                                    <span className={`h-1.5 w-1.5 rounded-full ${styling.dot}`} />
                                                    <span>{styling.label}</span>
                                                    <svg className="h-2.5 w-2.5 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                                                </button>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center justify-center space-x-1">
                                                    {item.status === 'brouillon' && (
                                                        <>
                                                            <Link href={route('commandes-achat.edit', item.id)}
                                                                className="p-1.5 text-slate-450 hover:text-indigo-650 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all" title="Modifier">
                                                                <svg className="h-4 w-4 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                                </svg>
                                                            </Link>
                                                            <button onClick={() => setDeleteTarget(item)}
                                                                className="p-1.5 text-slate-455 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-all" title="Supprimer">
                                                                <svg className="h-4 w-4 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        </>
                                                    )}
                                                    {item.status !== 'brouillon' && (
                                                        <div className="flex items-center space-x-1">
                                                            <Link href={route('commandes-achat.edit', item.id)}
                                                                className="p-1.5 text-slate-450 hover:text-indigo-650 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all" title="Consulter les détails">
                                                                <svg className="h-4 w-4 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                </svg>
                                                            </Link>
                                                            {(item.status === 'commandee' || item.status === 'recue partiellement') && (
                                                                <button type="button" onClick={() => startCloning(item)}
                                                                    className="p-1.5 text-violet-500 hover:text-violet-750 hover:bg-violet-50 dark:hover:bg-violet-955/20 rounded-xl transition-all" title="Convertir en Bon de Réception">
                                                                    <svg className="h-4 w-4 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                                                    </svg>
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {commandes.last_page > 1 && (
                        <div className="p-6 border-t border-slate-100/80 dark:border-slate-800/60 flex items-center justify-between flex-wrap gap-4 bg-slate-50/10 dark:bg-slate-950/5">
                            <span className="text-xs text-slate-455 dark:text-slate-455">
                                Affichage de <span className="font-extrabold text-slate-800 dark:text-slate-200">{(commandes.current_page - 1) * commandes.per_page + 1}</span> à <span className="font-extrabold text-slate-800 dark:text-slate-200">{Math.min(commandes.current_page * commandes.per_page, commandes.total)}</span> sur <span className="font-extrabold text-slate-800 dark:text-slate-200">{commandes.total}</span> commandes
                            </span>
                            <div className="flex items-center space-x-1.5">
                                {commandes.links.map((link, idx) => {
                                    const isPrev = link.label.includes('Previous');
                                    const isNext = link.label.includes('Next');
                                    const renderLabel = () => {
                                        if (isPrev) return <svg className="h-3.5 w-3.5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
                                        if (isNext) return <svg className="h-3.5 w-3.5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>;
                                        return <span className="font-black text-xs">{link.label}</span>;
                                    };
                                    if (!link.url) return <span key={idx} className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-300 dark:text-slate-700 select-none cursor-not-allowed border border-transparent">{renderLabel()}</span>;
                                    return (
                                        <Link key={idx} href={link.url} preserveScroll
                                            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-150 active:scale-90 border ${link.active ? 'bg-indigo-600 text-white border-indigo-650 shadow-lg shadow-indigo-600/20' : 'bg-transparent text-slate-500 dark:text-slate-400 border-transparent hover:border-slate-200 dark:hover:border-slate-800 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'}`}>
                                            {renderLabel()}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Change Status Modal */}
                {statusTarget && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-fade-in">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-[2rem] shadow-3xl p-6">
                            <div className="flex items-center space-x-3 text-indigo-500 mb-3">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-855 dark:text-white">Modifier le statut</h3>
                            </div>
                            {(statusTarget.status === 'recue' || statusTarget.status === 'recue partiellement') && (
                                <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-955/20 border border-rose-200 dark:border-rose-900/40 rounded-2xl text-xs font-semibold text-rose-700 dark:text-rose-455 leading-relaxed">
                                    ⚠️ Cette commande a été reçue ou partiellement reçue. Son statut est géré par les bons de réception et ne peut plus être modifié manuellement.
                                </div>
                            )}
                            <p className="text-xs text-slate-500 mb-5">Modifier le statut de la commande <strong className="text-slate-800 dark:text-slate-200">"{statusTarget.ref}"</strong> :</p>
                            <div className="space-y-2 mb-6">
                                {(['brouillon', 'commandee', 'recue', 'recue partiellement', 'annulee'] as const).map(statusOption => {
                                    const st = STATUS_STYLING[statusOption];
                                    const isTargetReceived = statusTarget.status === 'recue' || statusTarget.status === 'recue partiellement';
                                    const isDisabled = (isTargetReceived && statusOption !== statusTarget.status) || 
                                                       ((statusOption === 'recue' || statusOption === 'recue partiellement') && statusTarget.status !== statusOption);
                                    return (
                                        <button key={statusOption} disabled={isDisabled} onClick={() => !isDisabled && changeStatus(statusTarget.id, statusOption)}
                                            className={`w-full flex items-center justify-between p-3 rounded-2xl border text-xs font-bold transition-all ${
                                                isDisabled ? 'opacity-40 cursor-not-allowed border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/50 active:scale-[0.99]'
                                            } ${
                                                statusTarget.status === statusOption ? 'border-indigo-500 bg-indigo-5/20 dark:bg-indigo-950/20' : 'border-slate-200 dark:border-slate-800'
                                            }`}>
                                            <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider border ${st.badge}`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                                                <span>{st.label}</span>
                                            </span>
                                            {statusTarget.status === statusOption && (
                                                <svg className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="flex justify-end">
                                <button onClick={() => setStatusTarget(null)} className="px-5 py-2.5 text-xs font-bold text-slate-655 dark:text-slate-350 bg-slate-100 dark:bg-slate-805 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-750 transition-all">Annuler</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Modal */}
                {deleteTarget && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-fade-in">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-[2rem] shadow-3xl p-6">
                            <div className="flex items-center space-x-3 text-rose-500 mb-3">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-855 dark:text-white">Supprimer la Commande</h3>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-455 leading-relaxed mb-6">
                                Êtes-vous sûr de vouloir supprimer la commande d'achat <strong>"{deleteTarget.ref}"</strong> ? Cette action est irréversible.
                            </p>
                            <div className="flex items-center justify-end space-x-3">
                                <button onClick={() => setDeleteTarget(null)} className="px-5 py-2.5 text-xs font-bold text-slate-655 dark:text-slate-350 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-750 transition-all">Annuler</button>
                                <button onClick={() => { router.delete(route('commandes-achat.destroy', deleteTarget.id), { onSuccess: () => setDeleteTarget(null) }); }}
                                    className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-2xl transition-all shadow-md shadow-rose-500/20 active:scale-[0.97]">
                                    Supprimer
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Conversion Modal (Commande Achat -> Bon de Réception) */}
                {cloneForm && cloneTarget && (
                    <div className="fixed inset-0 z-45 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 overflow-y-auto">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-5xl rounded-[2.5rem] shadow-3xl p-6 lg:p-8 my-8 max-h-[90vh] overflow-y-auto animate-fade-in">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-4 mb-6">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                        Convertir la Commande en Bon de Réception
                                    </h3>
                                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">
                                        Commande Référence: {cloneTarget.ref}
                                    </p>
                                </div>
                                <button type="button" onClick={() => { setCloneForm(null); setCloneTarget(null); }}
                                    className="p-1.5 text-slate-400 hover:text-slate-655 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all">
                                    <svg className="h-5 w-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={submitClone} className="space-y-6">
                                {/* General Details */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-950/20 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                                    <div>
                                        <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">Fournisseur</label>
                                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 py-2.5 px-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                                            {cloneTarget.tier ? cloneTarget.tier.label : '—'}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">Date de Réception <span className="text-rose-500">*</span></label>
                                        <input type="date" className="block w-full rounded-xl border border-slate-200/85 dark:border-slate-800/85 bg-white dark:bg-slate-900 text-xs py-2 px-3 focus:outline-none focus:border-indigo-500 text-slate-855 dark:text-slate-200 font-bold font-mono"
                                            value={cloneForm.date_reception} onChange={e => setCloneForm({ ...cloneForm, date_reception: e.target.value })} required />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">Devise</label>
                                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 py-2.5 px-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                                            {cloneTarget.devise.code} ({cloneTarget.devise.symbol || ''})
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5 font-bold">Branche</label>
                                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 py-2.5 px-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                                            {cloneTarget.branche ? cloneTarget.branche.name : '—'}
                                        </div>
                                    </div>
                                </div>

                                {/* Lines Table */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-855 dark:text-white">Lignes du Bon de Réception</h4>
                                    <div className="overflow-x-auto border border-slate-100 dark:border-slate-800/85 rounded-2xl">
                                        <table className="w-full text-left min-w-[700px]">
                                            <thead>
                                                <tr className="bg-slate-50/50 dark:bg-slate-950/5 border-b border-slate-100 dark:border-slate-800/80 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
                                                    <th className="py-3 px-4">Produit</th>
                                                    <th className="py-3 px-2 w-28">Quantité</th>
                                                    <th className="py-3 px-2 w-28">P.U. HT</th>
                                                    <th className="py-3 px-2 w-48">Entrepôt <span className="text-rose-500">*</span></th>
                                                    <th className="py-3 px-4 text-center w-36">Lots</th>
                                                    <th className="py-3 px-4 text-center w-24">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                                                {cloneForm.lines.map((line, idx) => {
                                                    const isLotManaged = line.product?.manage_by_lot || false;
                                                    const isLotsFullyAllocated = (() => {
                                                        if (!line.lots || line.lots.length === 0) return false;
                                                        const allocated = line.lots.reduce((sum, l) => sum + l.quantity, 0);
                                                        const numericQty = Number(line.qty) || 0;
                                                        let targetQty = numericQty;
                                                        if (line.product) {
                                                            const stockUnit = line.product.stock_unit;
                                                            const lineUnit = line.purchase_unit || line.product.purchase_unit;
                                                            if (stockUnit && lineUnit && lineUnit.id !== stockUnit.id) {
                                                                const ratioLine = Number(lineUnit.ratio) || 1.0;
                                                                const ratioStock = Number(stockUnit.ratio) || 1.0;
                                                                if (ratioStock > 0) {
                                                                     targetQty = numericQty * (ratioLine / ratioStock);
                                                                }
                                                            }
                                                        }
                                                        return Math.abs(allocated - targetQty) <= 0.0001;
                                                    })();

                                                    return (
                                                        <tr key={idx} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/5 transition-all">
                                                            <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                                                                <div>{line.product?.ref ? `[${line.product.ref}] ` : ''}{line.product?.label}</div>
                                                                {line.commande_achat_line_id && (
                                                                    <div className="text-[10px] text-slate-455 mt-0.5 font-medium">
                                                                        Commandé: <span className="font-bold text-slate-600 dark:text-slate-400">{line.original_qty}</span> | Déjà reçu: <span className="font-bold text-slate-600 dark:text-slate-400">{line.qty_receptionnee}</span>
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="py-3 px-2 font-bold font-mono text-slate-700 dark:text-slate-300">
                                                                <div className="flex items-center space-x-1">
                                                                    <input type="number" step="any" min="0.0001"
                                                                        className="w-20 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs py-1 px-1.5 focus:outline-none focus:border-indigo-500 font-bold font-mono text-slate-800 dark:text-slate-200"
                                                                        value={line.qty}
                                                                        onChange={e => handleCloneLineQtyChange(idx, Number(e.target.value) || 0)}
                                                                    />
                                                                    <span className="text-[10px] text-slate-455 uppercase">{line.purchase_unit?.code || ''}</span>
                                                                </div>
                                                                {(() => {
                                                                    const stockUnit = line.product?.stock_unit;
                                                                    const lineUnit = line.purchase_unit || line.product.purchase_unit;
                                                                    if (!stockUnit || !lineUnit || lineUnit.id === stockUnit.id) return null;
                                                                    const ratioLine = Number(lineUnit.ratio) || 1.0;
                                                                    const ratioStock = Number(stockUnit.ratio) || 1.0;
                                                                    const numericQty = Number(line.qty) || 0;
                                                                    const convertedQty = ratioStock > 0 ? (numericQty * (ratioLine / ratioStock)) : numericQty;
                                                                    return (
                                                                        <div className="text-[9px] text-indigo-500 font-extrabold leading-none mt-0.5">
                                                                            = {convertedQty} {stockUnit.code}
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </td>
                                                            <td className="py-3 px-2 font-semibold font-mono text-slate-600 dark:text-slate-400">
                                                                <DecimalInput
                                                                    decimals={decimals}
                                                                    className="w-24 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 text-xs py-1 px-1.5 focus:outline-none focus:border-indigo-500 font-semibold font-mono text-slate-800 dark:text-slate-200"
                                                                    value={Number(line.pu_ht || 0)}
                                                                    onChange={val => handleCloneLinePuHtChange(idx, val)}
                                                                />
                                                            </td>
                                                            <td className="py-3 px-2">
                                                                <select className="block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 text-xs py-1.5 px-3 focus:outline-none focus:border-indigo-500 transition-all font-semibold text-slate-800 dark:text-slate-200"
                                                                    value={line.entrepot_id} onChange={e => handleCloneLineWarehouseChange(idx, e.target.value)} required>
                                                                    <option value="">Sélectionner...</option>
                                                                    {entrepots.map(ent => (
                                                                        <option key={ent.id} value={ent.id}>{ent.label} ({ent.code})</option>
                                                                    ))}
                                                                </select>
                                                            </td>
                                                            <td className="py-3 px-4 text-center">
                                                                {isLotManaged ? (
                                                                    <button type="button" onClick={() => setActiveCloneLineIndex(idx)}
                                                                        className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-[9px] font-extrabold uppercase tracking-widest transition-all cursor-pointer ${
                                                                            isLotsFullyAllocated 
                                                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-455 border border-emerald-500/20'
                                                                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-455 border border-amber-500/20'
                                                                        }`}>
                                                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                                        </svg>
                                                                        <span>{isLotsFullyAllocated ? 'Lots Ok' : 'Allouer Lots'}</span>
                                                                    </button>
                                                                ) : (
                                                                    <span className="text-[10px] text-slate-400 font-bold italic select-none">—</span>
                                                                )}
                                                            </td>
                                                            <td className="py-3 px-4 text-center">
                                                                <button type="button" onClick={() => handleRemoveCloneLine(idx)}
                                                                    className="p-1 text-slate-450 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-all"
                                                                    title="Supprimer cette ligne">
                                                                    <svg className="h-4 w-4 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                    </svg>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-50 dark:bg-slate-950/20 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60 gap-4 mt-3">
                                        <div className="flex items-center space-x-2 w-full sm:w-72">
                                            <select
                                                className="block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs py-2 px-3 focus:outline-none focus:border-indigo-500 transition-all font-semibold text-slate-800 dark:text-slate-200"
                                                value=""
                                                onChange={e => {
                                                    const prodId = e.target.value;
                                                    if (!prodId) return;
                                                    const prod = products.find(p => p.id.toString() === prodId);
                                                    if (prod) {
                                                        handleAddProductToClone(prod);
                                                    }
                                                    e.target.value = "";
                                                }}
                                            >
                                                <option value="">+ Ajouter un produit au bon de réception...</option>
                                                {products.map(p => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.ref ? `[${p.ref}] ` : ''}{p.label} - {p.purchase_price} DH
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="text-right w-full sm:w-auto">
                                            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Total Lignes Bon de Réception</span>
                                            <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 font-mono">
                                                {cloneForm.lines.reduce((sum, line) => sum + line.total_ttc, 0).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} <span className="text-[10px] text-slate-400">{cloneTarget.devise.symbol || cloneTarget.devise.code}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                                    <button type="button" onClick={() => { setCloneForm(null); setCloneTarget(null); }}
                                        className="px-5 py-2.5 text-xs font-bold text-slate-655 dark:text-slate-455 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-205 transition-all">
                                        Annuler
                                    </button>
                                    <button type="submit" disabled={isSubmittingClone}
                                        className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl transition-all shadow-lg shadow-indigo-500/10 active:scale-95 disabled:opacity-50">
                                        {isSubmittingClone ? 'Création...' : 'Confirmer et Créer le Bon de Réception'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {activeCloneLineIndex !== null && cloneForm && (() => {
                    const line = cloneForm.lines[activeCloneLineIndex];
                    const product = line.product;
                    const stockUnit = product?.stock_unit;
                    const lineUnit = line.purchase_unit || product?.purchase_unit;
                    
                    const numericQty = Number(line.qty) || 0;
                    let targetQty = numericQty;
                    if (stockUnit && lineUnit && lineUnit.id !== stockUnit.id) {
                        const ratioLine = Number(lineUnit.ratio) || 1.0;
                        const ratioStock = Number(stockUnit.ratio) || 1.0;
                        if (ratioStock > 0) {
                            targetQty = numericQty * (ratioLine / ratioStock);
                        }
                    }

                    return (
                        <LotAllocationModal
                            isOpen={activeCloneLineIndex !== null}
                            onClose={() => setActiveCloneLineIndex(null)}
                            productName={product?.label || ''}
                            productId={line.product_id}
                            entrepotId={line.entrepot_id}
                            requestedQty={targetQty}
                            unitCode={product?.stock_unit?.code || 'U'}
                            initialLots={line.lots}
                            allowManualLots={true}
                            onConfirm={(allocatedLots) => {
                                const updated = [...cloneForm.lines];
                                updated[activeCloneLineIndex].lots = allocatedLots;
                                setCloneForm({
                                    ...cloneForm,
                                    lines: updated
                                });
                                setActiveCloneLineIndex(null);
                            }}
                        />
                    );
                })()}

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
                            <button onClick={() => setLocalFlash(null)} className="text-slate-400 hover:text-slate-655 dark:hover:text-slate-355 transition-all shrink-0">
                                <svg className="h-4 w-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
