import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import LotAllocationModal, { LineLot } from '@/Components/LotAllocationModal';
import DecimalInput from '@/Components/DecimalInput';
import { useEntitySettings } from '@/Utils/entitySettings';

interface Employee { id: number; first_name: string; last_name: string; }
interface Tier { id: number; label: string; }
interface Devise { id: number; code: string; symbol: string | null; }

interface DemandePrix {
    id: number;
    ref: string;
    employee: Employee | null;
    tier: Tier;
    date_demande: string;
    date_validite: string | null;
    total_ht: number;
    total_ttc: number;
    status: 'brouillon' | 'valide' | 'annulee' | 'commande' | 'commande partiellement';
    devise: Devise;
    commandes_achat?: any[];
    branche?: { id: number; name: string };
}

interface PaginationLink { url: string | null; label: string; active: boolean; }

interface PaginatedDemandes {
    data: DemandePrix[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLink[];
}

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

interface LookupItem {
    id: number;
    label: string;
    code?: string;
}

interface CloneLineItem {
    demande_prix_line_id: string;
    original_qty: number;
    qty_commande: number;
    product_id: string;
    qty: number;
    purchase_unit_id: string;
    tva: number;
    pu_ht: number;
    pu_ttc: number;
    remise: number;
    rm: number;
    total_ht: number;
    total_ttc: number;
    entrepot_id: string;
    lots: LineLot[];
    product?: Product;
    purchase_unit?: Unit;
}

interface CloneFormState {
    tier_id: string;
    date_commande: string;
    devise_id: string;
    branche_id: string;
    demande_prix_id: string;
    lines: CloneLineItem[];
}

const STATUS_STYLING: Record<string, {badge: string; dot: string; label: string}> = {
    'brouillon': { badge: 'bg-slate-500/10 text-slate-650 dark:text-slate-400 border-slate-500/20',   dot: 'bg-slate-500',   label: 'Brouillon' },
    'valide':    { badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20', dot: 'bg-emerald-500', label: 'Validé' },
    'annulee':   { badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border-rose-500/20',        dot: 'bg-rose-500',   label: 'Annulée' },
    'commande':  { badge: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',    dot: 'bg-indigo-500',  label: 'Commandé' },
    'commande partiellement': { badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', dot: 'bg-amber-500', label: 'Commandé partiel' }
};

export default function Index({
    demandes,
    filters,
    entrepots = [],
    units = [],
    products = [],
}: {
    demandes: PaginatedDemandes;
    filters: { search: string | null; status: string | null };
    entrepots?: LookupItem[];
    units?: Unit[];
    products?: Product[];
}) {
    const { decimals } = useEntitySettings();
    const { flash } = usePage().props as any;
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [statusTarget, setStatusTarget] = useState<DemandePrix | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<DemandePrix | null>(null);
    const [localFlash, setLocalFlash] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const isFirstRender = useRef(true);

    // Cloning DemandePrix to CommandeAchat states
    const [cloneTarget, setCloneTarget] = useState<DemandePrix | null>(null);
    const [isFetchingCloneDetails, setIsFetchingCloneDetails] = useState(false);
    const [cloneForm, setCloneForm] = useState<CloneFormState | null>(null);
    const [isSubmittingClone, setIsSubmittingClone] = useState(false);
    const [activeCloneLineIndex, setActiveCloneLineIndex] = useState<number | null>(null);

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
            router.get(route('demandes-prix.index'), { search: search || undefined, status: statusFilter || undefined }, { preserveState: true, replace: true });
        }, 300);
        return () => clearTimeout(delay);
    }, [search, statusFilter]);

    const changeStatus = (id: number, newStatus: string) => {
        router.post(route('demandes-prix.toggle-status', id), { status: newStatus }, {
            onSuccess: () => setStatusTarget(null),
            preserveScroll: true,
        });
    };

    const recalculateCloneLineTotals = (line: CloneLineItem): CloneLineItem => {
        const qty = Number(line.qty) || 0;
        const puHt = Number(line.pu_ht) || 0;
        const tva = Number(line.tva) || 0;
        const remise = Number(line.remise) || 0;

        const rm = Number(((qty * puHt) * (remise / 100)).toFixed(4));
        const lineHt = qty * puHt;
        const totalHt = Math.max(0, lineHt - rm);
        const puTtc = Number((puHt * (1 + tva / 100)).toFixed(4));
        const totalTtc = totalHt * (1 + tva / 100);

        return {
            ...line,
            rm,
            total_ht: totalHt,
            pu_ttc: puTtc,
            total_ttc: totalTtc
        };
    };

    const handleCloneLineQtyChange = (index: number, val: number) => {
        if (!cloneForm) return;
        const updatedLines = [...cloneForm.lines];
        updatedLines[index].qty = val;
        updatedLines[index] = recalculateCloneLineTotals(updatedLines[index]);
        setCloneForm({ ...cloneForm, lines: updatedLines });
    };

    const handleCloneLinePuHtChange = (index: number, val: number) => {
        if (!cloneForm) return;
        const updatedLines = [...cloneForm.lines];
        updatedLines[index].pu_ht = val;
        updatedLines[index] = recalculateCloneLineTotals(updatedLines[index]);
        setCloneForm({ ...cloneForm, lines: updatedLines });
    };

    const handleCloneLineWarehouseChange = (index: number, val: string) => {
        if (!cloneForm) return;
        const updatedLines = [...cloneForm.lines];
        updatedLines[index].entrepot_id = val;
        updatedLines[index].lots = [];
        setCloneForm({ ...cloneForm, lines: updatedLines });
    };

    const handleRemoveCloneLine = (index: number) => {
        if (!cloneForm) return;
        setCloneForm({
            ...cloneForm,
            lines: cloneForm.lines.filter((_, idx) => idx !== index)
        });
    };

    const handleAddProductToClone = (prod: Product) => {
        if (!cloneForm) return;
        const newLine: CloneLineItem = {
            demande_prix_line_id: '',
            original_qty: 0,
            qty_commande: 0,
            product_id: prod.id.toString(),
            qty: 1,
            purchase_unit_id: prod.purchase_unit_id ? prod.purchase_unit_id.toString() : '',
            tva: 20,
            pu_ht: Number(prod.purchase_price) || 0,
            pu_ttc: Number((Number(prod.purchase_price) * 1.2).toFixed(4)),
            remise: 0,
            rm: 0,
            total_ht: Number(prod.purchase_price) || 0,
            total_ttc: Number(prod.purchase_price) * 1.2,
            entrepot_id: entrepots.length > 0 ? entrepots[0].id.toString() : '',
            lots: [],
            product: prod,
            purchase_unit: prod.purchase_unit
        };
        setCloneForm({
            ...cloneForm,
            lines: [...cloneForm.lines, newLine]
        });
    };

    const openCloneLotModal = (index: number) => {
        if (!cloneForm) return;
        const line = cloneForm.lines[index];
        if (!line.product_id || !line.entrepot_id) {
            alert("Veuillez sélectionner un produit et un entrepôt.");
            return;
        }
        setActiveCloneLineIndex(index);
    };

    const startCloning = (item: DemandePrix) => {
        setCloneTarget(item);
        setIsFetchingCloneDetails(true);
        fetch(`/api/demandes-prix/${item.id}`)
            .then(res => {
                if (!res.ok) throw new Error();
                return res.json();
            })
            .then((data: any) => {
                const today = new Date().toISOString().split('T')[0];
                const initialLines = data.lines.map((line: any) => {
                    const qty = Number(line.qty);
                    const qtyCommande = Number(line.qty_commande || 0);
                    const defaultQty = Math.max(0, qty - qtyCommande);

                    const itemHt = defaultQty * Number(line.pu_ht);
                    const itemRm = Number(((defaultQty * Number(line.pu_ht)) * (Number(line.remise || 0) / 100)).toFixed(4));
                    const totalHt = Math.max(0, itemHt - itemRm);
                    const totalTtc = totalHt * (1 + Number(line.tva) / 100);

                    return {
                        demande_prix_line_id: line.id.toString(),
                        original_qty: qty,
                        qty_commande: qtyCommande,
                        product_id: line.product_id.toString(),
                        qty: defaultQty,
                        purchase_unit_id: line.purchase_unit_id ? line.purchase_unit_id.toString() : '',
                        tva: Number(line.tva),
                        pu_ht: Number(line.pu_ht),
                        pu_ttc: Number(line.pu_ttc),
                        remise: Number(line.remise || 0),
                        rm: itemRm,
                        total_ht: totalHt,
                        total_ttc: totalTtc,
                        entrepot_id: entrepots.length > 0 ? entrepots[0].id.toString() : '',
                        lots: [],
                        product: line.product,
                        purchase_unit: line.purchase_unit
                    };
                });

                setCloneForm({
                    tier_id: data.tier_id.toString(),
                    date_commande: today,
                    devise_id: data.devise_id.toString(),
                    branche_id: data.branche_id ? data.branche_id.toString() : '',
                    demande_prix_id: data.id.toString(),
                    lines: initialLines
                });
                setCloneTarget(data);
                setIsFetchingCloneDetails(false);
            })
            .catch(() => {
                setLocalFlash({ type: 'error', message: 'Erreur lors de la récupération des détails de la demande.' });
                setIsFetchingCloneDetails(false);
                setCloneTarget(null);
            });
    };

    const submitClone = (e: React.FormEvent) => {
        e.preventDefault();
        if (!cloneForm) return;

        for (let i = 0; i < cloneForm.lines.length; i++) {
            const line = cloneForm.lines[i];
            const prod = line.product;
            if (prod?.manage_by_lot) {
                const activeUnitId = line.purchase_unit_id || prod.purchase_unit_id;
                const lineUnit = units.find(u => u.id.toString() === activeUnitId?.toString());
                const stockUnit = prod.stock_unit;

                let requestedQty = line.qty;
                if (stockUnit && lineUnit && lineUnit.id !== stockUnit.id) {
                    const ratioLine = Number(lineUnit.ratio) || 1.0;
                    const ratioStock = Number(stockUnit.ratio) || 1.0;
                    if (ratioStock > 0) {
                        requestedQty = line.qty * (ratioLine / ratioStock);
                    }
                }

                const allocated = line.lots?.reduce((sum, l) => sum + l.quantity, 0) || 0;
                if (Math.abs(allocated - requestedQty) > 0.0001) {
                    alert(`Veuillez allouer les lots pour la ligne n° ${i + 1} (${prod.label}) avant d'enregistrer.`);
                    return;
                }
            }
        }

        setIsSubmittingClone(true);

        const payload = {
            demande_prix_id: cloneForm.demande_prix_id,
            tier_id: cloneForm.tier_id,
            date_commande: cloneForm.date_commande,
            devise_id: cloneForm.devise_id,
            branche_id: cloneForm.branche_id || null,
            status: 'brouillon',
            lines: cloneForm.lines.map(line => ({
                demande_prix_line_id: line.demande_prix_line_id || null,
                product_id: line.product_id,
                entrepot_id: line.entrepot_id,
                purchase_unit_id: line.purchase_unit_id || null,
                tva: line.tva,
                qty: line.qty,
                pu_ht: line.pu_ht,
                pu_ttc: line.pu_ttc,
                remise: line.remise,
                rm: line.rm,
                total_ht: line.total_ht,
                total_ttc: line.total_ttc,
                lots: line.lots
            }))
        };

        router.post(route('commandes-achat.store'), payload as any, {
            onSuccess: () => {
                setCloneForm(null);
                setCloneTarget(null);
                setIsSubmittingClone(false);
            },
            onError: () => {
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
                        <span className="text-indigo-650 dark:text-indigo-400">Demandes de Prix (RFQ)</span>
                    </div>
                    <div className="flex items-center mt-1.5 flex-wrap gap-3">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Demandes de Prix</h2>
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border-indigo-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                            <span>{demandes.total} au total</span>
                        </span>
                    </div>
                </div>
                <Link href={route('demandes-prix.create')}
                    className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-3 rounded-2xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                    <span>Nouvelle Demande de Prix</span>
                </Link>
            </div>
        }>
            <Head title="Demandes de Prix (RFQ)" />

            <div className="max-w-7xl mx-auto space-y-5">
                {/* Filters */}
                <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-5 backdrop-blur-xl flex flex-wrap gap-4 items-center animate-fade-in">
                    <div className="relative flex-1 min-w-[200px]">
                        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input type="text" placeholder="Rechercher par référence, fournisseur, demandeur..." value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition-all" />
                    </div>
                    <select className="rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-955/40 text-xs font-semibold text-slate-800 dark:text-slate-200 py-2.5 px-4 focus:outline-none focus:border-indigo-500 transition-all"
                        value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="">Tous les statuts</option>
                        <option value="brouillon">Brouillon</option>
                        <option value="valide">Validé</option>
                        <option value="annulee">Annulée</option>
                        <option value="commande">Commandé</option>
                        <option value="commande partiellement">Commandé partiellement</option>
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
                                    <th className="py-4 px-6">Demandeur</th>
                                    <th className="py-4 px-6">Date RFQ</th>
                                    <th className="py-4 px-6">Limite validité</th>
                                    <th className="py-4 px-6 text-right">Total HT</th>
                                    <th className="py-4 px-6 text-right">Total TTC</th>
                                    <th className="py-4 px-6 text-center">Statut</th>
                                    <th className="py-4 px-6 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/30">
                                {demandes.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="py-12 text-center text-xs font-semibold text-slate-400">
                                            Aucune demande de prix trouvée.
                                         </td>
                                    </tr>
                                ) : demandes.data.map(item => {
                                    const styling = STATUS_STYLING[item.status] || STATUS_STYLING.brouillon;
                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/5 transition-colors">
                                            <td className="py-4 px-6 text-xs font-black text-slate-800 dark:text-slate-200">{item.ref}</td>
                                            <td className="py-4 px-6 text-xs font-bold text-slate-700 dark:text-slate-300">{item.tier ? item.tier.label : '—'}</td>
                                            <td className="py-4 px-6 text-xs font-medium text-slate-655 dark:text-slate-400">
                                                {item.employee ? `${item.employee.first_name} ${item.employee.last_name}` : '—'}
                                            </td>
                                            <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400 font-medium">{item.date_demande}</td>
                                            <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400 font-medium">{item.date_validite || '—'}</td>
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
                                                    {(item.status === 'valide' || item.status === 'commande partiellement') && (
                                                        <button onClick={() => startCloning(item)}
                                                            title="Créer la Commande d'Achat"
                                                            className="p-1.5 text-slate-450 hover:text-emerald-600 hover:bg-emerald-500/10 rounded-xl transition-all">
                                                            <svg className="h-4 w-4 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                    <Link href={route('demandes-prix.edit', item.id)}
                                                        className="p-1.5 text-slate-450 hover:text-indigo-650 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                                                        title={item.status === 'brouillon' ? "Modifier" : "Consulter les détails"}>
                                                        {item.status === 'brouillon' ? (
                                                            <svg className="h-4 w-4 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                            </svg>
                                                        ) : (
                                                            <svg className="h-4 w-4 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        )}
                                                    </Link>
                                                    {item.status === 'brouillon' && (
                                                        <button onClick={() => setDeleteTarget(item)}
                                                            className="p-1.5 text-slate-455 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-all" title="Supprimer">
                                                            <svg className="h-4 w-4 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
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
                    {demandes.last_page > 1 && (
                        <div className="p-6 border-t border-slate-100/80 dark:border-slate-800/60 flex items-center justify-between flex-wrap gap-4 bg-slate-50/10 dark:bg-slate-950/5">
                            <span className="text-xs text-slate-455 dark:text-slate-455">
                                Affichage de <span className="font-extrabold text-slate-800 dark:text-slate-200">{(demandes.current_page - 1) * demandes.per_page + 1}</span> à <span className="font-extrabold text-slate-800 dark:text-slate-200">{Math.min(demandes.current_page * demandes.per_page, demandes.total)}</span> sur <span className="font-extrabold text-slate-800 dark:text-slate-200">{demandes.total}</span> demandes
                            </span>
                            <div className="flex items-center space-x-1.5">
                                {demandes.links.map((link, idx) => {
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
                            <p className="text-xs text-slate-500 mb-5">Modifier le statut de la demande <strong className="text-slate-800 dark:text-slate-200">"{statusTarget.ref}"</strong> :</p>
                            <div className="space-y-2 mb-6">
                                {(['brouillon', 'valide', 'annulee'] as const).map(statusOption => {
                                    const st = STATUS_STYLING[statusOption];
                                    return (
                                        <button key={statusOption} onClick={() => changeStatus(statusTarget.id, statusOption)}
                                            className={`w-full flex items-center justify-between p-3 rounded-2xl border text-xs font-bold transition-all hover:bg-slate-50/50 dark:hover:bg-slate-850/50 active:scale-[0.99] ${statusTarget.status === statusOption ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20' : 'border-slate-200 dark:border-slate-800'}`}>
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
                                <button onClick={() => setStatusTarget(null)} className="px-5 py-2.5 text-xs font-bold text-slate-655 dark:text-slate-350 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-750 transition-all">Annuler</button>
                            </div>
                        </div>
                    </div>
                )}

            {/* Fetching Details Spinner */}
            {isFetchingCloneDetails && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/60 backdrop-blur-md">
                    <div className="flex flex-col items-center space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-650 border-t-transparent"></div>
                        <span className="text-xs font-bold text-slate-200">Récupération des détails de la demande...</span>
                    </div>
                </div>
            )}

            {/* Convert DemandePrix to CommandeAchat Modal */}
            {cloneForm && cloneTarget && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-5xl rounded-[2.5rem] shadow-3xl p-6 lg:p-8 my-8 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-4 mb-6">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                    Convertir en Commande d'Achat
                                </h3>
                                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">
                                    Demande Référence: {cloneTarget.ref}
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
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-955/20 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                                <div>
                                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5 font-bold">Fournisseur</label>
                                    <div className="text-xs font-black text-slate-800 dark:text-slate-205 py-2.5 px-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                                        {cloneTarget.tier.label}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5 font-bold">Date de Commande <span className="text-rose-500">*</span></label>
                                    <input type="date" className="block w-full rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 text-xs py-2.5 px-3 focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-200 font-bold font-mono"
                                        value={cloneForm.date_commande} onChange={e => setCloneForm({ ...cloneForm, date_commande: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5 font-bold">Devise</label>
                                    <div className="text-xs font-black text-slate-800 dark:text-slate-205 py-2.5 px-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                                        {cloneTarget.devise.code} ({cloneTarget.devise.symbol || ''})
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5 font-bold">Branche</label>
                                    <div className="text-xs font-black text-slate-800 dark:text-slate-205 py-2.5 px-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                                        {cloneTarget.branche ? cloneTarget.branche.name : '—'}
                                    </div>
                                </div>
                            </div>

                            {/* Lines Table */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-855 dark:text-white">Produits à commander</h4>
                                <div className="overflow-x-auto border border-slate-100 dark:border-slate-800/85 rounded-2xl">
                                    <table className="w-full text-left min-w-[800px]">
                                        <thead>
                                            <tr className="bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800/80 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
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
                                                    let targetQty = line.qty;
                                                    if (line.product) {
                                                        const stockUnit = line.product.stock_unit;
                                                        const lineUnit = line.purchase_unit;
                                                        if (stockUnit && lineUnit && lineUnit.id !== stockUnit.id) {
                                                            const ratioLine = Number(lineUnit.ratio) || 1.0;
                                                            const ratioStock = Number(stockUnit.ratio) || 1.0;
                                                            if (ratioStock > 0) {
                                                                targetQty = line.qty * (ratioLine / ratioStock);
                                                            }
                                                        }
                                                    }
                                                    return Math.abs(allocated - targetQty) <= 0.0001;
                                                })();

                                                return (
                                                    <tr key={idx} className="hover:bg-slate-50/40 dark:hover:bg-slate-855/5 transition-all">
                                                        <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                                                            <div className="font-bold text-slate-900 dark:text-white">{line.product?.ref ? `[${line.product.ref}] ` : ''}{line.product?.label}</div>
                                                            {line.demande_prix_line_id && (
                                                                <div className="text-[10px] text-slate-455 mt-0.5 font-medium">
                                                                    Qté RFQ: <span className="font-bold text-slate-655 dark:text-slate-400">{line.original_qty} {line.purchase_unit?.code || ''}</span> | Qté Commandée: <span className="font-bold text-slate-655 dark:text-slate-400">{line.qty_commande} {line.purchase_unit?.code || ''}</span>
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
                                                                <span className="text-[10px] text-slate-450 uppercase">{line.purchase_unit?.code || ''}</span>
                                                            </div>
                                                            {(() => {
                                                                const stockUnit = line.product?.stock_unit;
                                                                const lineUnit = line.purchase_unit;
                                                                if (!stockUnit || !lineUnit || lineUnit.id === stockUnit.id) return null;
                                                                const ratioLine = Number(lineUnit.ratio) || 1.0;
                                                                const ratioStock = Number(stockUnit.ratio) || 1.0;
                                                                const convertedQty = ratioStock > 0 ? (line.qty * (ratioLine / ratioStock)) : line.qty;
                                                                return (
                                                                    <div className="text-[9px] text-indigo-505 font-extrabold leading-none mt-0.5">
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
                                                            <select className="block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs py-1.5 px-3 focus:outline-none focus:border-indigo-500 transition-all font-semibold text-slate-800 dark:text-slate-200"
                                                                value={line.entrepot_id} onChange={e => handleCloneLineWarehouseChange(idx, e.target.value)} required>
                                                                <option value="">Sélectionner...</option>
                                                                {entrepots.map(ent => (
                                                                    <option key={ent.id} value={ent.id}>{ent.label} ({ent.code})</option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            {isLotManaged ? (
                                                                <button type="button" onClick={() => openCloneLotModal(idx)}
                                                                    className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-[9px] font-extrabold uppercase tracking-widest transition-all cursor-pointer ${
                                                                        isLotsFullyAllocated 
                                                                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-455 border border-emerald-500/20'
                                                                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-450 border border-amber-500/20'
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
                                                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-all"
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
                                <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-50 dark:bg-slate-955/20 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60 gap-4 mt-3">
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
                                            <option value="">+ Ajouter un produit à la commande...</option>
                                            {products.map(p => (
                                                <option key={p.id} value={p.id}>
                                                    {p.ref ? `[${p.ref}] ` : ''}{p.label} - {p.purchase_price} DH
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="text-right w-full sm:w-auto">
                                        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Total Lignes Commande</span>
                                        <span className="text-sm font-black text-indigo-650 dark:text-indigo-400 font-mono">
                                            {cloneForm.lines.reduce((sum, line) => sum + line.total_ttc, 0).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} <span className="text-[10px] text-slate-405">{cloneTarget.devise.symbol || cloneTarget.devise.code}</span>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                                <button type="button" onClick={() => { setCloneForm(null); setCloneTarget(null); }}
                                    className="px-5 py-2.5 text-xs font-bold text-slate-655 dark:text-slate-455 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-750 transition-all">
                                    Annuler
                                </button>
                                <button type="submit" disabled={isSubmittingClone}
                                    className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50">
                                    {isSubmittingClone ? 'Création...' : 'Confirmer et Créer la Commande'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Dynamic Lot Allocation Modal for Cloning */}
            {activeCloneLineIndex !== null && cloneForm && (() => {
                const line = cloneForm.lines[activeCloneLineIndex];
                const product = line.product;
                const activeUnitId = line.purchase_unit_id || product?.purchase_unit_id;
                const lineUnit = units.find(u => u.id.toString() === activeUnitId?.toString());
                const stockUnit = product?.stock_unit;

                let targetQty = line.qty;
                if (stockUnit && lineUnit && lineUnit.id !== stockUnit.id) {
                    const ratioLine = Number(lineUnit.ratio) || 1.0;
                    const ratioStock = Number(stockUnit.ratio) || 1.0;
                    if (ratioStock > 0) {
                        targetQty = line.qty * (ratioLine / ratioStock);
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
                            setCloneForm({ ...cloneForm, lines: updated });
                            setActiveCloneLineIndex(null);
                        }}
                    />
                );
            })()}

            {/* Delete Modal */}
                {deleteTarget && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-fade-in">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-[2rem] shadow-3xl p-6">
                            <div className="flex items-center space-x-3 text-rose-500 mb-3">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-855 dark:text-white">Supprimer la Demande</h3>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-455 leading-relaxed mb-6">
                                Êtes-vous sûr de vouloir supprimer la demande de prix <strong>"{deleteTarget.ref}"</strong> ? Cette action est irréversible.
                            </p>
                            <div className="flex items-center justify-end space-x-3">
                                <button onClick={() => setDeleteTarget(null)} className="px-5 py-2.5 text-xs font-bold text-slate-655 dark:text-slate-350 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-750 transition-all">Annuler</button>
                                <button onClick={() => { router.delete(route('demandes-prix.destroy', deleteTarget.id), { onSuccess: () => setDeleteTarget(null) }); }}
                                    className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-2xl transition-all shadow-md shadow-rose-500/20 active:scale-[0.97]">
                                    Supprimer
                                </button>
                            </div>
                        </div>
                    </div>
                )}

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
                                <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-855 dark:text-white">{localFlash.type === 'success' ? 'Succès' : 'Erreur'}</h4>
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-455 mt-1 leading-relaxed">{localFlash.message}</p>
                            </div>
                            <button onClick={() => setLocalFlash(null)} className="text-slate-400 hover:text-slate-655 dark:hover:text-slate-350 transition-all shrink-0">
                                <svg className="h-4 w-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
