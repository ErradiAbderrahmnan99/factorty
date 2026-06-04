import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface Entrepot {
    id: number;
    label: string;
    code: string;
}

interface AvailableLot {
    id: number;
    lot_number: string;
    quantity: number;
    fabrication_date: string | null;
    expiration_date: string | null;
}

interface CloneLineLot {
    lot_number: string;
    quantity: number;
    fabrication_date?: string | null;
    expiration_date?: string | null;
}

interface CloneLineItem {
    product_id: string;
    qty: number;
    sale_unit_id: string;
    tva: number;
    pu_ht: number;
    pu_ttc: number;
    remise: number;
    rm: number;
    total_ht: number;
    total_ttc: number;
    entrepot_id: string;
    lots: CloneLineLot[];
    product: {
        id: number;
        label: string;
        ref: string | null;
        manage_by_lot: boolean;
        stock_unit?: { id: number; code: string; ratio: number };
        sale_unit?: { id: number; code: string; ratio: number };
    };
    sale_unit?: { id: number; code: string; ratio: number } | null;
}

interface CloneFormState {
    tier_id: string;
    commercial: string;
    date_livraison: string;
    devise_id: string;
    commande_id: string;
    lines: CloneLineItem[];
}

interface Tier {
    id: number;
    label: string;
}

interface Devise {
    id: number;
    code: string;
    symbol: string | null;
}

interface Commande {
    id: number;
    ref: string;
    commercial: string | null;
    date_commande: string;
    status: 'brouillon' | 'valide' | 'annule' | 'livré';
    total_ht: number;
    total_tva: number;
    total_ttc: number;
    tier: Tier;
    devise: Devise;
    devis?: { id: number; ref: string } | null;
    livraisons?: { id: number; ref: string }[] | null;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedCommandes {
    data: Commande[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLink[];
}

const STATUS_STYLING = {
    'brouillon': { badge: 'bg-slate-500/10 text-slate-650 dark:text-slate-400 border-slate-500/20', dot: 'bg-slate-500', label: 'Brouillon' },
    'valide':    { badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-500', label: 'Validé' },
    'annule':    { badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border-rose-500/20', dot: 'bg-rose-500', label: 'Annulé' },
    'livré':     { badge: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20', dot: 'bg-violet-500', label: 'Livré' }
};

export default function Index({ 
    commandes, 
    filters,
    entrepots = [],
    products = []
}: { 
    commandes: PaginatedCommandes; 
    filters: { search: string | null; status: string | null };
    entrepots: Entrepot[];
    products?: any[];
}) {
    const { flash } = usePage().props as any;
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [statusTarget, setStatusTarget] = useState<Commande | null>(null);
    const [localFlash, setLocalFlash] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (flash?.success) {
            setLocalFlash({ type: 'success', message: flash.success });
            setStatusTarget(null);
            const timer = setTimeout(() => setLocalFlash(null), 5000);
            return () => clearTimeout(timer);
        } else if (flash?.error) {
            setLocalFlash({ type: 'error', message: flash.error });
            setStatusTarget(null);
            const timer = setTimeout(() => setLocalFlash(null), 7000);
            return () => clearTimeout(timer);
        }
    }, [flash]);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        const delayDebounce = setTimeout(() => {
            router.get(route('commandes.index'), {
                search: search || undefined,
                status: statusFilter || undefined,
            }, { preserveState: true, replace: true });
        }, 300);
        return () => clearTimeout(delayDebounce);
    }, [search, statusFilter]);

    const [deleteTarget, setDeleteTarget] = useState<Commande | null>(null);

    const changeStatus = (id: number, newStatus: string) => {
        router.post(route('commandes.toggle-status', id), { status: newStatus }, {
            onSuccess: () => setStatusTarget(null),
            preserveScroll: true
        });
    };

    const [cloneForm, setCloneForm] = useState<CloneFormState | null>(null);
    const [cloneTarget, setCloneTarget] = useState<Commande | null>(null);
    const [isSubmittingClone, setIsSubmittingClone] = useState(false);
    const [cloneErrors, setCloneErrors] = useState<Record<string, string>>({});

    const [activeCloneLineIndex, setActiveCloneLineIndex] = useState<number | null>(null);
    const [cloneAvailableLots, setCloneAvailableLots] = useState<AvailableLot[]>([]);
    const [isLoadingCloneLots, setIsLoadingCloneLots] = useState(false);
    const [cloneAllocatedLotsMap, setCloneAllocatedLotsMap] = useState<Record<string, number>>({});
    const [cloneLotModalError, setCloneLotModalError] = useState<string | null>(null);

    // Manual input states
    const [manualCloneLotNumber, setManualCloneLotNumber] = useState('');
    const [manualCloneLotQty, setManualCloneLotQty] = useState('');
    const [manualCloneFabricationDate, setManualCloneFabricationDate] = useState('');
    const [manualCloneExpirationDate, setManualCloneExpirationDate] = useState('');

    const startCloning = async (commande: Commande) => {
        try {
            const response = await axios.get(`/api/commandes/${commande.id}`);
            const data = response.data;
            setCloneTarget(commande);
            setCloneForm({
                tier_id: data.tier_id.toString(),
                commercial: data.commercial || '',
                date_livraison: new Date().toISOString().split('T')[0],
                devise_id: data.devise_id.toString(),
                commande_id: data.id.toString(),
                lines: data.lines.map((line: any) => ({
                    product_id: line.product_id.toString(),
                    qty: line.qty,
                    sale_unit_id: line.sale_unit_id ? line.sale_unit_id.toString() : '',
                    tva: Number(line.tva) || 20.00,
                    pu_ht: Number(line.pu_ht),
                    pu_ttc: Number(line.pu_ttc),
                    remise: Number(line.remise) || 0,
                    rm: Number(line.rm) || 0,
                    total_ht: Number(line.total_ht),
                    total_ttc: Number(line.total_ttc),
                    entrepot_id: line.entrepot_id ? line.entrepot_id.toString() : (entrepots.length > 0 ? entrepots[0].id.toString() : ''),
                    lots: line.lots ? line.lots.map((l: any) => ({
                        lot_number: l.lot_number,
                        quantity: Number(l.quantity),
                        fabrication_date: l.fabrication_date,
                        expiration_date: l.expiration_date
                    })) : [],
                    product: line.product,
                    sale_unit: line.sale_unit
                }))
            });
        } catch (error) {
            console.error("Error fetching order details for conversion", error);
            alert("Erreur lors de la récupération des détails de la commande.");
        }
    };

    const handleCloneLineQtyChange = (index: number, val: string) => {
        if (!cloneForm) return;
        const qty = Math.max(0.0001, Number(val) || 0);
        const updatedLines = [...cloneForm.lines];
        const line = updatedLines[index];
        
        const lineHt = qty * line.pu_ht;
        const discount = (lineHt * line.remise / 100) + line.rm;
        const total_ht = Math.max(0, lineHt - discount);
        const total_ttc = total_ht * (1 + line.tva / 100);

        updatedLines[index] = {
            ...line,
            qty,
            total_ht,
            total_ttc,
            lots: []
        };
        setCloneForm({
            ...cloneForm,
            lines: updatedLines
        });
    };

    const handleCloneLinePuHtChange = (index: number, val: string) => {
        if (!cloneForm) return;
        const pu_ht = Math.max(0, Number(val) || 0);
        const updatedLines = [...cloneForm.lines];
        const line = updatedLines[index];
        
        const pu_ttc = pu_ht * (1 + line.tva / 100);
        const lineHt = line.qty * pu_ht;
        const discount = (lineHt * line.remise / 100) + line.rm;
        const total_ht = Math.max(0, lineHt - discount);
        const total_ttc = total_ht * (1 + line.tva / 100);

        updatedLines[index] = {
            ...line,
            pu_ht,
            pu_ttc,
            total_ht,
            total_ttc
        };
        setCloneForm({
            ...cloneForm,
            lines: updatedLines
        });
    };

    const handleCloneLineWarehouseChange = (index: number, val: string) => {
        if (!cloneForm) return;
        const updatedLines = [...cloneForm.lines];
        updatedLines[index] = {
            ...updatedLines[index],
            entrepot_id: val,
            lots: []
        };
        setCloneForm({
            ...cloneForm,
            lines: updatedLines
        });
    };

    const handleAddProductToClone = (prod: any) => {
        if (!cloneForm) return;
        const newLine: CloneLineItem = {
            product_id: prod.id.toString(),
            qty: 1,
            sale_unit_id: prod.sale_unit_id ? prod.sale_unit_id.toString() : '',
            tva: 20.00,
            pu_ht: Number(prod.sale_price || 0),
            pu_ttc: Number(prod.sale_price || 0) * 1.20,
            remise: 0,
            rm: 0,
            total_ht: Number(prod.sale_price || 0),
            total_ttc: Number(prod.sale_price || 0) * 1.20,
            entrepot_id: entrepots.length > 0 ? entrepots[0].id.toString() : '',
            lots: [],
            product: {
                id: prod.id,
                label: prod.label,
                ref: prod.ref,
                manage_by_lot: !!prod.manage_by_lot,
                stock_unit: prod.stock_unit,
                sale_unit: prod.sale_unit
            },
            sale_unit: prod.sale_unit
        };

        setCloneForm({
            ...cloneForm,
            lines: [...cloneForm.lines, newLine]
        });
    };

    const handleRemoveCloneLine = (index: number) => {
        if (!cloneForm) return;
        const updatedLines = cloneForm.lines.filter((_, idx) => idx !== index);
        setCloneForm({
            ...cloneForm,
            lines: updatedLines
        });
    };

    const openCloneLotModal = (index: number) => {
        if (!cloneForm) return;
        const line = cloneForm.lines[index];
        if (!line.product_id || !line.entrepot_id) {
            alert("Veuillez sélectionner un entrepôt.");
            return;
        }
        
        setActiveCloneLineIndex(index);
        setIsLoadingCloneLots(true);
        setCloneLotModalError(null);
        setManualCloneLotNumber('');
        setManualCloneLotQty('');
        setManualCloneFabricationDate('');
        setManualCloneExpirationDate('');
        
        const currentMap: Record<string, number> = {};
        line.lots.forEach(lot => {
            currentMap[lot.lot_number] = lot.quantity;
        });
        setCloneAllocatedLotsMap(currentMap);

        axios.get(`/api/entrepot-lots?product_id=${line.product_id}&entrepot_id=${line.entrepot_id}`)
            .then(res => {
                setCloneAvailableLots(res.data);
                setIsLoadingCloneLots(false);
            })
            .catch(() => {
                setCloneLotModalError('Impossible de récupérer les lots disponibles.');
                setIsLoadingCloneLots(false);
            });
    };

    const handleUpdateCloneLotQty = (lotNumber: string, value: string) => {
        const qty = Math.max(0, Number(value) || 0);
        setCloneAllocatedLotsMap(prev => ({
            ...prev,
            [lotNumber]: qty
        }));
    };

    const addManualCloneLot = () => {
        if (!manualCloneLotNumber.trim()) {
            setCloneLotModalError("Le numéro de lot ne peut pas être vide.");
            return;
        }
        const qty = Number(manualCloneLotQty) || 0;
        if (qty <= 0) {
            setCloneLotModalError("La quantité doit être supérieure à 0.");
            return;
        }
        
        if (cloneAvailableLots.some(l => l.lot_number.toLowerCase() === manualCloneLotNumber.trim().toLowerCase())) {
            setCloneLotModalError("Ce lot existe déjà dans la liste.");
            return;
        }

        const newLot: AvailableLot = {
            id: -Date.now(),
            lot_number: manualCloneLotNumber.trim(),
            quantity: 999999,
            fabrication_date: manualCloneFabricationDate || null,
            expiration_date: manualCloneExpirationDate || null
        };

        setCloneAvailableLots(prev => [...prev, newLot]);
        setCloneAllocatedLotsMap(prev => ({
            ...prev,
            [newLot.lot_number]: qty
        }));
        setManualCloneLotNumber('');
        setManualCloneLotQty('');
        setManualCloneFabricationDate('');
        setManualCloneExpirationDate('');
        setCloneLotModalError(null);
    };

    const saveCloneLotsAllocation = () => {
        if (activeCloneLineIndex === null || !cloneForm) return;
        const line = cloneForm.lines[activeCloneLineIndex];
        const product = line.product;
        const stockUnit = product?.stock_unit;
        const lineUnit = line.sale_unit;
        
        let requestedQty = line.qty;
        if (stockUnit && lineUnit && lineUnit.id !== stockUnit.id) {
            const ratioLine = Number(lineUnit.ratio) || 1.0;
            const ratioStock = Number(stockUnit.ratio) || 1.0;
            if (ratioStock > 0) {
                requestedQty = line.qty * (ratioLine / ratioStock);
            }
        }

        const lotsData: CloneLineLot[] = [];
        let totalAllocated = 0;

        Object.entries(cloneAllocatedLotsMap).forEach(([lotNumber, qty]) => {
            if (qty > 0) {
                const foundLot = cloneAvailableLots.find(l => l.lot_number === lotNumber);
                lotsData.push({
                    lot_number: lotNumber,
                    quantity: qty,
                    fabrication_date: foundLot?.fabrication_date || null,
                    expiration_date: foundLot?.expiration_date || null,
                });
                totalAllocated += qty;
            }
        });

        if (Math.abs(totalAllocated - requestedQty) > 0.0001) {
            setCloneLotModalError(`La quantité totale allouée (${totalAllocated}) doit être exactement égale à la quantité requise (${requestedQty}).`);
            return;
        }

        const updatedLines = [...cloneForm.lines];
        updatedLines[activeCloneLineIndex] = {
            ...line,
            lots: lotsData
        };
        setCloneForm({
            ...cloneForm,
            lines: updatedLines
        });
        setActiveCloneLineIndex(null);
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
            if (line.product?.manage_by_lot) {
                const stockUnit = line.product.stock_unit;
                const lineUnit = line.sale_unit;
                
                let requestedQty = line.qty;
                if (stockUnit && lineUnit && lineUnit.id !== stockUnit.id) {
                    const ratioLine = Number(lineUnit.ratio) || 1.0;
                    const ratioStock = Number(stockUnit.ratio) || 1.0;
                    if (ratioStock > 0) {
                        requestedQty = line.qty * (ratioLine / ratioStock);
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

        router.post(route('livraisons.store'), cloneForm as any, {
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
                        <span>Ventes</span><span>/</span>
                        <span className="text-indigo-600 dark:text-indigo-400">Commandes Clients</span>
                    </div>
                    <div className="flex items-center mt-1.5 flex-wrap gap-3">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Commandes Clients</h2>
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border-indigo-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                            <span>{commandes.total} au total</span>
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
                    <Link href={route('commandes.create')}
                        className="inline-flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-widest rounded-2xl h-[42px] px-6 shadow-lg shadow-indigo-500/20 active:scale-[0.97] transition-all shrink-0">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                        <span>Nouvelle Commande</span>
                    </Link>
                </div>
            </div>
        }>
            <Head title="Commandes Clients" />
            <div className="max-w-7xl mx-auto space-y-5">
                
                {/* Filters */}
                <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl p-5 backdrop-blur-xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </span>
                            <input type="text" className="pl-11 pr-4 py-3 w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                                value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par référence, tiers, commercial..." />
                        </div>
                        <select className="py-3 px-4 w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl text-xs focus:outline-none focus:border-indigo-500 transition-all"
                            value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                            <option value="">Tous les statuts</option>
                            <option value="brouillon">Brouillon</option>
                            <option value="valide">Validé & Déduit</option>
                            <option value="annule">Annulé</option>
                        </select>
                    </div>
                </div>

                {/* Datatable */}
                <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl overflow-hidden backdrop-blur-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800/50">
                                    <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest w-40">Référence</th>
                                    <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Tiers</th>
                                    <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest w-36">Date</th>
                                    <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest w-40 text-right">Total HT</th>
                                    <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest w-40 text-right">Total TTC</th>
                                    <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest w-36 text-center">Statut</th>
                                    <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest w-32 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/30">
                                {commandes.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-xs font-semibold text-slate-400">
                                            Aucune commande client trouvée.
                                        </td>
                                    </tr>
                                ) : (
                                    commandes.data.map(item => {
                                        const styling = STATUS_STYLING[item.status] || STATUS_STYLING.brouillon;
                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/5 transition-colors">
                                                <td className="py-4 px-6 text-xs font-black text-slate-800 dark:text-slate-200">
                                                    {item.ref}
                                                    {item.devis && (
                                                        <div className="mt-1">
                                                            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Devis lié :</span>
                                                            <span className="text-[9px] font-extrabold text-indigo-500 block">
                                                                {item.devis.ref}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {item.livraisons && item.livraisons.length > 0 && (
                                                        <div className="mt-1 flex flex-col space-y-0.5">
                                                            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Bons de Livraison liés :</span>
                                                            {item.livraisons.map(bl => (
                                                                <a key={bl.id} href={`/livraisons`}
                                                                    className="text-[9px] font-extrabold text-violet-500 hover:text-violet-750 hover:underline block"
                                                                    title={`Voir le BL ${bl.ref}`}
                                                                >
                                                                    {bl.ref}
                                                                </a>
                                                            ))}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                        {item.tier ? item.tier.label : '—'}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-medium">
                                                        Commercial: {item.commercial || 'Aucun'}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400 font-medium">
                                                    {item.date_commande}
                                                </td>
                                                <td className="py-4 px-6 text-xs font-bold text-slate-700 dark:text-slate-350 text-right">
                                                    {item.total_ht.toFixed(2)} {item.devise ? item.devise.symbol || item.devise.code : ''}
                                                </td>
                                                <td className="py-4 px-6 text-xs font-extrabold text-slate-900 dark:text-white text-right">
                                                    {item.total_ttc.toFixed(2)} {item.devise ? item.devise.symbol || item.devise.code : ''}
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
                                                                <Link
                                                                    href={route('commandes.edit', item.id)}
                                                                    className="p-1.5 text-slate-450 hover:text-indigo-650 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                                                                    title="Modifier"
                                                                >
                                                                    <svg className="h-4 w-4 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                                    </svg>
                                                                </Link>
                                                                <button
                                                                    onClick={() => setDeleteTarget(item)}
                                                                    className="p-1.5 text-slate-455 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-all"
                                                                    title="Supprimer"
                                                                >
                                                                    <svg className="h-4 w-4 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                    </svg>
                                                                </button>
                                                            </>
                                                        )}
                                                        {item.status !== 'brouillon' && (
                                                            <div className="flex items-center space-x-1">
                                                                <Link
                                                                    href={route('commandes.edit', item.id)}
                                                                    className="p-1.5 text-slate-450 hover:text-indigo-650 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                                                                    title="Consulter les détails (Lecture seule)"
                                                                >
                                                                    <svg className="h-4 w-4 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                    </svg>
                                                                </Link>
                                                                {(item.status === 'valide' || item.status === 'livré') && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => startCloning(item)}
                                                                        className="p-1.5 text-violet-500 hover:text-violet-750 hover:bg-violet-50 dark:hover:bg-violet-950/20 rounded-xl transition-all"
                                                                        title="Convertir en Bon de Livraison"
                                                                    >
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
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {commandes.last_page > 1 && (
                        <div className="p-6 border-t border-slate-100/80 dark:border-slate-800/60 flex items-center justify-between flex-wrap gap-4 bg-slate-50/10 dark:bg-slate-950/5">
                            <span className="text-xs text-slate-450 dark:text-slate-450">
                                Affichage de <span className="font-extrabold text-slate-800 dark:text-slate-200">{(commandes.current_page - 1) * commandes.per_page + 1}</span> à <span className="font-extrabold text-slate-800 dark:text-slate-200">{Math.min(commandes.current_page * commandes.per_page, commandes.total)}</span> sur <span className="font-extrabold text-slate-800 dark:text-slate-200">{commandes.total}</span> commandes
                            </span>

                            <div className="flex items-center space-x-1.5">
                                {commandes.links.map((link, idx) => {
                                    const isPrev = link.label.includes('Previous');
                                    const isNext = link.label.includes('Next');
                                    
                                    const renderLabel = () => {
                                        if (isPrev) {
                                            return (
                                                <svg className="h-3.5 w-3.5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                                </svg>
                                            );
                                        }
                                        if (isNext) {
                                            return (
                                                <svg className="h-3.5 w-3.5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                                </svg>
                                            );
                                        }
                                        return <span className="font-black text-xs">{link.label}</span>;
                                    };

                                    if (!link.url) {
                                        return (
                                            <span key={idx} className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-300 dark:text-slate-700 select-none cursor-not-allowed border border-transparent">
                                                {renderLabel()}
                                            </span>
                                        );
                                    }

                                    return (
                                        <Link key={idx} href={link.url} preserveScroll
                                            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-150 active:scale-90 border ${
                                                link.active
                                                    ? 'bg-indigo-600 text-white border-indigo-650 shadow-lg shadow-indigo-600/20'
                                                    : 'bg-transparent text-slate-500 dark:text-slate-400 border-transparent hover:border-slate-200 dark:hover:border-slate-800 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:text-slate-850 dark:hover:text-white'
                                            }`}>
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
                            <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-850 dark:text-white">
                                Modifier le statut
                            </h3>
                        </div>
                        {statusTarget.status === 'livré' && (
                            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-2xl text-xs font-semibold text-rose-700 dark:text-rose-455 leading-relaxed">
                                ⚠️ Cette commande a été livrée. Son statut est définitif et ne peut plus être modifié.
                            </div>
                        )}
                        <p className="text-xs text-slate-500 mb-5">Modifier le statut de la commande <strong className="text-slate-800 dark:text-slate-200">"{statusTarget.ref}"</strong> :</p>
                        <div className="space-y-2 mb-6">
                            {['brouillon', 'valide', 'annule', 'livré'].map(statusOption => {
                                const st = STATUS_STYLING[statusOption as keyof typeof STATUS_STYLING];
                                const isDisabled = (statusTarget.status === 'livré' && statusOption !== 'livré') || (statusOption === 'livré' && statusTarget.status !== 'livré');
                                return (
                                    <button key={statusOption} disabled={isDisabled} onClick={() => !isDisabled && changeStatus(statusTarget.id, statusOption)}
                                        className={`w-full flex items-center justify-between p-3 rounded-2xl border text-xs font-bold transition-all ${
                                            isDisabled ? 'opacity-40 cursor-not-allowed border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/50 active:scale-[0.99]'
                                        } ${
                                            statusTarget.status === statusOption ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20' : 'border-slate-200 dark:border-slate-800'
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
                            <button onClick={() => setStatusTarget(null)} className="px-5 py-2.5 text-xs font-bold text-slate-650 dark:text-slate-350 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-750 transition-all">Annuler</button>
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
                            <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-850 dark:text-white">
                                Supprimer la Commande
                            </h3>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed mb-6">
                            Êtes-vous sûr de vouloir supprimer la commande <strong>"{deleteTarget.ref}"</strong> ? Cette action est irréversible.
                        </p>
                        <div className="flex items-center justify-end space-x-3">
                            <button onClick={() => setDeleteTarget(null)}
                                className="px-5 py-2.5 text-xs font-bold text-slate-650 dark:text-slate-350 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-750 transition-all">
                                Annuler
                            </button>
                            <button onClick={() => {
                                router.delete(route('commandes.destroy', deleteTarget.id), {
                                    onSuccess: () => setDeleteTarget(null)
                                });
                            }}
                                className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-2xl transition-all shadow-md shadow-rose-500/20 active:scale-[0.97]">
                                Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Success/Error Floating Toast Notification */}
            {localFlash && (
                <div className="fixed top-5 right-5 z-[100] max-w-sm w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[2rem] shadow-3xl p-4 animate-slide-in backdrop-blur-xl">
                    <div className="flex items-start space-x-3.5">
                        <div className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 ${
                            localFlash.type === 'success' 
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/20' 
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-450 border border-rose-500/20'
                        }`}>
                            {localFlash.type === 'success' ? (
                                <svg className="h-5 w-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                <svg className="h-5 w-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-850 dark:text-white">
                                {localFlash.type === 'success' ? 'Succès' : 'Erreur'}
                            </h4>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-455 mt-1 leading-relaxed">
                                {localFlash.message}
                            </p>
                        </div>
                        <button onClick={() => setLocalFlash(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 transition-all shrink-0">
                            <svg className="h-4 w-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Conversion Modal (Commande -> Bon de Livraison) */}
            {cloneForm && cloneTarget && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl rounded-[2.5rem] shadow-3xl p-6 lg:p-8 my-8 max-h-[90vh] overflow-y-auto animate-fade-in">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-4 mb-6">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                    Convertir la Commande en Bon de Livraison
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
                                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">Client</label>
                                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300 py-2.5 px-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                                        {cloneTarget.tier ? cloneTarget.tier.label : '—'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">Date de Livraison <span className="text-rose-500">*</span></label>
                                    <input type="date" className="block w-full rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 text-xs py-2 px-3 focus:outline-none focus:border-indigo-500 text-slate-855 dark:text-slate-200 font-bold font-mono"
                                        value={cloneForm.date_livraison} onChange={e => setCloneForm({ ...cloneForm, date_livraison: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">Devise</label>
                                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300 py-2.5 px-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                                        {cloneTarget.devise.code} ({cloneTarget.devise.symbol || ''})
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">Commercial</label>
                                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300 py-2.5 px-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                                        {cloneTarget.commercial || '—'}
                                    </div>
                                </div>
                            </div>

                            {/* Lines Table */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-855 dark:text-white">Lignes du Bon de Livraison</h4>
                                <div className="overflow-x-auto border border-slate-100 dark:border-slate-800/85 rounded-2xl">
                                    <table className="w-full text-left min-w-[700px]">
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
                                                        const lineUnit = line.sale_unit;
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
                                                    <tr key={idx} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/5 transition-all">
                                                        <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                                                            {line.product?.ref ? `[${line.product.ref}] ` : ''}{line.product?.label}
                                                        </td>
                                                        <td className="py-3 px-2 font-bold font-mono text-slate-700 dark:text-slate-300">
                                                            <div className="flex items-center space-x-1">
                                                                <input type="number" step="any" min="0.0001"
                                                                    className="w-20 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs py-1 px-1.5 focus:outline-none focus:border-indigo-500 font-bold font-mono text-slate-800 dark:text-slate-200"
                                                                    value={line.qty || ''}
                                                                    onChange={e => handleCloneLineQtyChange(idx, e.target.value)}
                                                                />
                                                                <span className="text-[10px] text-slate-450 uppercase">{line.sale_unit?.code || ''}</span>
                                                            </div>
                                                            {(() => {
                                                                const stockUnit = line.product?.stock_unit;
                                                                const lineUnit = line.sale_unit;
                                                                if (!stockUnit || !lineUnit || lineUnit.id === stockUnit.id) return null;
                                                                const ratioLine = Number(lineUnit.ratio) || 1.0;
                                                                const ratioStock = Number(stockUnit.ratio) || 1.0;
                                                                const convertedQty = ratioStock > 0 ? (line.qty * (ratioLine / ratioStock)) : line.qty;
                                                                return (
                                                                    <div className="text-[9px] text-indigo-500 font-extrabold leading-none mt-0.5">
                                                                        = {convertedQty} {stockUnit.code}
                                                                    </div>
                                                                );
                                                            })()}
                                                        </td>
                                                        <td className="py-3 px-2 font-semibold font-mono text-slate-600 dark:text-slate-400">
                                                            <input type="number" step="any" min="0"
                                                                className="w-24 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs py-1 px-1.5 focus:outline-none focus:border-indigo-500 font-semibold font-mono text-slate-800 dark:text-slate-200"
                                                                value={line.pu_ht || ''}
                                                                onChange={e => handleCloneLinePuHtChange(idx, e.target.value)}
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
                                                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-all"
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
                                            <option value="">+ Ajouter un produit au bon de livraison...</option>
                                            {products.map(p => (
                                                <option key={p.id} value={p.id}>
                                                    {p.ref ? `[${p.ref}] ` : ''}{p.label} - {p.sale_price} DH
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="text-right w-full sm:w-auto">
                                        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Total Lignes Bon de Livraison</span>
                                        <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 font-mono">
                                            {cloneForm.lines.reduce((sum, line) => sum + line.total_ttc, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px] text-slate-400">{cloneTarget.devise.symbol || cloneTarget.devise.code}</span>
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
                                    {isSubmittingClone ? 'Création...' : 'Confirmer et Créer le Bon de Livraison'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Dynamic Lot Allocation Modal for Cloning */}
            {activeCloneLineIndex !== null && cloneForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-[2.5rem] shadow-3xl p-6 lg:p-8 transform transition-all max-h-[85vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-4 mb-6">
                            <div>
                                <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-850 dark:text-white">
                                    Allocation des lots (Clonage)
                                </h3>
                                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">
                                    Produit: {cloneForm.lines[activeCloneLineIndex].product?.label}
                                </p>
                            </div>
                            <button type="button" onClick={() => setActiveCloneLineIndex(null)}
                                className="p-1.5 text-slate-400 hover:text-slate-655 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all">
                                <svg className="h-5 w-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {cloneLotModalError && (
                            <div className="mb-4 p-3.5 bg-rose-50 dark:bg-rose-950/35 border border-rose-100 dark:border-rose-900/50 text-rose-650 dark:text-rose-455 rounded-2xl text-xs font-bold leading-normal">
                                {cloneLotModalError}
                            </div>
                        )}

                        {(() => {
                            const line = cloneForm.lines[activeCloneLineIndex];
                            const product = line.product;
                            const stockUnit = product?.stock_unit;
                            const lineUnit = line.sale_unit;
                            let requestedQty = line.qty;
                            let unitCode = lineUnit?.code || '';
                            if (stockUnit && lineUnit && lineUnit.id !== stockUnit.id) {
                                const ratioLine = Number(lineUnit.ratio) || 1.0;
                                const ratioStock = Number(stockUnit.ratio) || 1.0;
                                if (ratioStock > 0) {
                                    requestedQty = line.qty * (ratioLine / ratioStock);
                                    unitCode = stockUnit.code;
                                }
                            }
                            return (
                                <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/40 p-4 rounded-2xl mb-6 flex justify-between text-xs font-bold text-indigo-755 dark:text-indigo-305 w-full">
                                    <div>Quantité demandée (Unité Stock): <span className="font-extrabold text-sm">{requestedQty.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })} {unitCode}</span></div>
                                    <div>
                                        Quantité allouée: <span className="font-extrabold text-sm font-mono">
                                            {Object.values(cloneAllocatedLotsMap).reduce((s, q) => s + q, 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })} {unitCode}
                                        </span>
                                    </div>
                                </div>
                            );
                        })()}

                        {isLoadingCloneLots ? (
                            <div className="py-12 flex flex-col items-center justify-center space-y-3">
                                <svg className="animate-spin h-6 w-6 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Chargement des lots...</span>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {cloneAvailableLots.length === 0 ? (
                                    <div className="py-10 text-center text-xs font-bold text-slate-455 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                                        Aucun lot disponible dans l'entrepôt pour cet article.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="hidden md:grid grid-cols-4 gap-4 px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-450">
                                            <span>N° Lot</span>
                                            <span>Stock Restant</span>
                                            <span>Date Expiration</span>
                                            <span className="text-right">Qté à Allouer</span>
                                        </div>
                                        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                            {cloneAvailableLots.map(lot => (
                                                <div key={lot.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 items-center bg-slate-50 dark:bg-slate-950/40 p-3.5 rounded-2xl border border-slate-100/50 dark:border-slate-855">
                                                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">{lot.lot_number}</span>
                                                    
                                                    <div className="flex flex-col md:block">
                                                        <span className="text-[9px] md:hidden font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Stock disponible</span>
                                                        <span className="text-xs font-bold text-slate-655 dark:text-slate-400">{lot.quantity === 999999 ? 'Nouveau lot' : `${lot.quantity} en stock`}</span>
                                                    </div>

                                                    <div className="flex flex-col md:block">
                                                        <span className="text-[9px] md:hidden font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Date Expi</span>
                                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-455">{lot.expiration_date || '—'}</span>
                                                    </div>

                                                    <div>
                                                        <input type="number" step="any" min="0" max={lot.quantity}
                                                            placeholder="0"
                                                            className="block w-full md:w-32 ml-auto rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 text-xs py-2 px-3 text-right focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200 font-bold"
                                                            value={cloneAllocatedLotsMap[lot.lot_number] || ''}
                                                            onChange={e => handleUpdateCloneLotQty(lot.lot_number, e.target.value)} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Manual Lot Inputs */}
                                <div className="pt-5 border-t border-slate-100 dark:border-slate-800/60 mt-4">
                                    <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-455 dark:text-slate-400 mb-3">
                                        Ajouter un lot manuellement
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
                                        <div>
                                            <label className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">N° Lot</label>
                                            <input type="text" placeholder="Ex: LOT-2026-001"
                                                className="block w-full rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/40 text-xs py-2.5 px-3 focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200 font-bold"
                                                value={manualCloneLotNumber} onChange={e => setManualCloneLotNumber(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">Qté à Allouer</label>
                                            <input type="number" step="any" min="0" placeholder="0.00"
                                                className="block w-full rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/40 text-xs py-2.5 px-3 text-right focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200 font-bold"
                                                value={manualCloneLotQty} onChange={e => setManualCloneLotQty(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">Date Fab.</label>
                                            <input type="date"
                                                className="block w-full rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/40 text-xs py-2 px-3 focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200 font-bold font-mono"
                                                value={manualCloneFabricationDate} onChange={e => setManualCloneFabricationDate(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">Date Exp.</label>
                                            <input type="date"
                                                className="block w-full rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/40 text-xs py-2 px-3 focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200 font-bold font-mono"
                                                value={manualCloneExpirationDate} onChange={e => setManualCloneExpirationDate(e.target.value)} />
                                        </div>
                                        <button type="button" onClick={addManualCloneLot}
                                            className="w-full sm:w-auto h-[38px] inline-flex items-center justify-center space-x-1.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-655 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all active:scale-[0.97] col-span-2 md:col-span-1">
                                            <svg className="h-4 w-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                            </svg>
                                            <span>Ajouter</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end space-x-3 pt-6 border-t border-slate-100 dark:border-slate-800/60 mt-6">
                            <button type="button" onClick={() => setActiveCloneLineIndex(null)}
                                className="px-5 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-455 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 transition-all">
                                Annuler
                            </button>
                            <button type="button" onClick={saveCloneLotsAllocation}
                                className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl transition-all shadow-lg shadow-indigo-500/10 active:scale-95">
                                Confirmer l'Allocation
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </AuthenticatedLayout>
    );
}
