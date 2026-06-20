import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState, useRef } from 'react';
import InputError from '@/Components/InputError';
import DecimalInput from '@/Components/DecimalInput';
import { useEntitySettings } from '@/Utils/entitySettings';


interface TauxTva {
    id: number;
    code: string;
    libelle: string;
    taux: number;
    actif: boolean;
}

interface Tier {
    id: number;
    label: string;
    type: string;
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
    sale_price: number;
    sale_unit_id: number | null;
    manage_by_lot: boolean;
    stock_unit?: Unit;
    unit_category_id: number | null;
}

interface Devise {
    id: number;
    code: string;
    label: string;
    symbol: string | null;
}

interface Entrepot {
    id: number;
    label: string;
    code: string;
}

interface LineLot {
    id?: number;
    lot_number: string;
    quantity: number;
    fabrication_date?: string | null;
    expiration_date?: string | null;
}

interface LineItem {
    id?: number;
    product_id: string;
    entrepot_id: string;
    sale_unit_id: string;
    taux_tva_id: string;
    tva: number;
    qty: number;
    pu_ht: number;
    pu_ttc: number;
    remise: number;
    rm: number;
    total_ht: number;
    total_ttc: number;
    lots: LineLot[];
}

interface Commande {
    id: number;
    ref: string;
    tier_id: number;
    commercial: string | null;
    date_commande: string;
    devise_id: number;
    branche_id: number | null;
    status: string;
    lines: {
        id: number;
        product_id: number;
        entrepot_id: number;
        sale_unit_id: number | null;
        taux_tva_id?: number | null;
        tva: number;
        qty: number;
        pu_ht: number;
        pu_ttc: number;
        remise: number;
        rm: number;
        total_ht: number;
        total_ttc: number;
        lots: { id?: number; lot_number: string; quantity: number; fabrication_date?: string | null; expiration_date?: string | null; }[];
    }[];
}

interface AvailableLot {
    id: number;
    lot_number: string;
    quantity: number;
    fabrication_date: string | null;
    expiration_date: string | null;
}

export default function Edit({
    commande,
    tiers,
    products,
    devises,
    units,
    entrepots,
    commercials,
    branches = [],
    tauxTvas = [],
}: {
    commande: Commande;
    tiers: Tier[];
    products: Product[];
    devises: Devise[];
    units: Unit[];
    entrepots: Entrepot[];
    commercials: { id: number; first_name: string; last_name: string; type: string; }[];
    branches?: { id: number; name: string; }[];
    tauxTvas?: TauxTva[];
}) {
    const { decimals, defaultTva, defaultTvaId, defaultDeviseId, formatMoney, roundMoney, stepMoney } = useEntitySettings();

    const { data, setData, put, processing, errors } = useForm({
        tier_id: commande.tier_id.toString(),
        commercial: commande.commercial || '',
        date_commande: commande.date_commande,
        devise_id: commande.devise_id.toString(),
        branche_id: commande.branche_id ? commande.branche_id.toString() : '',
        lines: commande.lines.map(line => ({
            id: line.id,
            product_id: line.product_id.toString(),
            entrepot_id: line.entrepot_id.toString(),
            sale_unit_id: line.sale_unit_id ? line.sale_unit_id.toString() : '',
            taux_tva_id: line.taux_tva_id ? String(line.taux_tva_id) : '',
            tva: (tauxTvas || []).find(t => t.id.toString() === (line.taux_tva_id || '').toString())?.taux || 0,
            qty: Number(line.qty),
            pu_ht: Number(line.pu_ht),
            pu_ttc: Number(line.pu_ttc),
            remise: Number(line.remise),
            rm: Number(line.rm),
            total_ht: Number(line.total_ht),
            total_ttc: Number(line.total_ttc),
            lots: line.lots.map(l => ({
                id: (l as any).id,
                lot_number: l.lot_number,
                quantity: Number(l.quantity),
                fabrication_date: l.fabrication_date || null,
                expiration_date: l.expiration_date || null,
            })),
        })) as LineItem[],
    });

    const isReadOnly = commande.status === 'valide' || commande.status === 'livré' || commande.status === 'livré partiellement';

    // Lot Allocation Modal State
    const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);
    const [availableLots, setAvailableLots] = useState<AvailableLot[]>([]);
    const [isLoadingLots, setIsLoadingLots] = useState(false);
    const [allocatedLotsMap, setAllocatedLotsMap] = useState<Record<string, number>>({});
    const [lotModalError, setLotModalError] = useState<string | null>(null);

    const [manualLotNumber, setManualLotNumber] = useState('');
    const [manualLotQty, setManualLotQty] = useState('');
    const [manualFabricationDate, setManualFabricationDate] = useState('');
    const [manualExpirationDate, setManualExpirationDate] = useState('');

    const addManualLot = () => {
        if (!manualLotNumber.trim()) {
            setLotModalError("Le numéro de lot ne peut pas être vide.");
            return;
        }
        const qty = Number(manualLotQty) || 0;
        if (qty <= 0) {
            setLotModalError("La quantité doit être supérieure à 0.");
            return;
        }
        
        // Check if lot already exists in availableLots
        if (availableLots.some(l => l.lot_number.toLowerCase() === manualLotNumber.trim().toLowerCase())) {
            setLotModalError("Ce lot existe déjà dans la liste.");
            return;
        }

        const newLot: AvailableLot = {
            id: -Date.now(), // temporary negative ID
            lot_number: manualLotNumber.trim(),
            quantity: 999999, // Allow high limit for manual lot
            fabrication_date: manualFabricationDate || null,
            expiration_date: manualExpirationDate || null
        };

        setAvailableLots(prev => [...prev, newLot]);
        setAllocatedLotsMap(prev => ({
            ...prev,
            [newLot.lot_number]: qty
        }));
        setManualLotNumber('');
        setManualLotQty('');
        setManualFabricationDate('');
        setManualExpirationDate('');
        setLotModalError(null);
    };

    const addLine = () => {
        const newLine: LineItem = {
            product_id: '',
            entrepot_id: entrepots.length > 0 ? entrepots[0].id.toString() : '',
            sale_unit_id: '',
            taux_tva_id: defaultTvaId ? String(defaultTvaId) : '',
            tva: defaultTva,
            qty: 1,
            pu_ht: 0,
            pu_ttc: 0,
            remise: 0,
            rm: 0,
            total_ht: 0,
            total_ttc: 0,
            lots: [],
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
            const prod = products.find(p => p.id.toString() === value);
            if (prod) {
                line.pu_ht = Number(prod.sale_price) || 0;
                line.sale_unit_id = prod.sale_unit_id ? prod.sale_unit_id.toString() : '';
                line.taux_tva_id = defaultTvaId ? String(defaultTvaId) : '';
                line.tva = defaultTva;
                line.pu_ttc = roundMoney(line.pu_ht * (1 + line.tva / 100));
                line.rm = roundMoney((line.qty * line.pu_ht) * (line.remise / 100));
                line.lots = []; // reset lots on product change
            }
        } else if (field === 'entrepot_id') {
            line.entrepot_id = value;
            line.lots = []; // reset lots on warehouse change
        } else if (field === 'remise') {
            line.remise = Number(value) || 0;
            line.rm = roundMoney((line.qty * line.pu_ht) * (line.remise / 100));
        } else if (field === 'rm') {
            line.rm = Number(value) || 0;
            const lineHtTotal = line.qty * line.pu_ht;
            line.remise = lineHtTotal > 0 ? roundMoney((line.rm / lineHtTotal) * 100) : 0;
        } else if (field === 'taux_tva_id') {
            const selectedTauxTva = tauxTvas.find(t => t.id.toString() === value);
            line.taux_tva_id = value;
            line.tva = selectedTauxTva ? Number(selectedTauxTva.taux) : 0;
            line.pu_ttc = roundMoney(line.pu_ht * (1 + line.tva / 100));
            line.rm = roundMoney((line.qty * line.pu_ht) * (line.remise / 100));
        } else if (field === 'qty' || field === 'tva') {
            line[field] = Number(value) || 0;
            line.pu_ttc = roundMoney(line.pu_ht * (1 + line.tva / 100));
            line.rm = roundMoney((line.qty * line.pu_ht) * (line.remise / 100));
            line.lots = []; // reset lots if quantity changes to force reallocation
        } else if (field === 'pu_ht') {
            line.pu_ht = Number(value) || 0;
            line.pu_ttc = roundMoney(line.pu_ht * (1 + line.tva / 100));
            line.rm = roundMoney((line.qty * line.pu_ht) * (line.remise / 100));
        } else if (field === 'pu_ttc') {
            line.pu_ttc = Number(value) || 0;
            line.pu_ht = roundMoney(line.pu_ttc / (1 + line.tva / 100));
            line.rm = roundMoney((line.qty * line.pu_ht) * (line.remise / 100));
        } else {
            (line as any)[field] = value;
        }

        const lineHt = line.qty * line.pu_ht;
        const discount = line.rm;
        line.total_ht = roundMoney(Math.max(0, lineHt - discount));
        line.total_ttc = roundMoney(line.total_ht * (1 + line.tva / 100));

        updated[index] = line;
        setData('lines', updated);
    };

    // Calculate Summary Totals
    const totalHT = data.lines.reduce((sum, item) => sum + item.total_ht, 0);
    const totalTTC = data.lines.reduce((sum, item) => sum + item.total_ttc, 0);
    const totalTVA = Math.max(0, totalTTC - totalHT);
    const totalRemise = data.lines.reduce((sum, item) => sum + item.rm, 0);

    // Fetch and Open Lot Modal
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
            showToast('Veuillez sélectionner d\'abord un produit et un entrepôt.');
            return;
        }
        
        setActiveLineIndex(index);
        setIsLoadingLots(true);
        setLotModalError(null);
        setManualLotNumber('');
        setManualLotQty('');
        setManualFabricationDate('');
        setManualExpirationDate('');
        
        // Prep current lot allocations mapping
        const currentMap: Record<string, number> = {};
        line.lots.forEach(lot => {
            currentMap[lot.lot_number] = lot.quantity;
        });
        setAllocatedLotsMap(currentMap);

        // Fetch lots from backend
        fetch(`/api/entrepot-lots?product_id=${line.product_id}&entrepot_id=${line.entrepot_id}`)
            .then(res => res.json())
            .then((fetchedLots: AvailableLot[]) => {
                const merged = [...fetchedLots];
                line.lots.forEach(savedLot => {
                    if (!merged.some(l => l.lot_number === savedLot.lot_number)) {
                        merged.push({
                            id: -Math.abs(savedLot.id || Date.now()),
                            lot_number: savedLot.lot_number,
                            quantity: 999999,
                            fabrication_date: savedLot.fabrication_date || null,
                            expiration_date: savedLot.expiration_date || null
                        });
                    }
                });
                setAvailableLots(merged);
                setIsLoadingLots(false);
            })
            .catch(() => {
                setLotModalError('Impossible de récupérer les lots disponibles.');
                setIsLoadingLots(false);
            });
    };

    const handleUpdateLotQty = (lotNumber: string, value: string) => {
        const qty = Math.max(0, Number(value) || 0);
        setAllocatedLotsMap(prev => ({
            ...prev,
            [lotNumber]: qty
        }));
    };

    const saveLotsAllocation = () => {
        if (activeLineIndex === null) return;
        const line = data.lines[activeLineIndex];
        const product = products.find(p => p.id.toString() === line.product_id);
        const activeUnitId = line.sale_unit_id || product?.sale_unit_id;
        const lineUnit = units.find(u => u.id.toString() === activeUnitId?.toString());
        const stockUnit = (product as any)?.stock_unit;
        
        let requestedQty = line.qty;
        if (stockUnit && lineUnit && lineUnit.id !== stockUnit.id) {
            const ratioLine = Number(lineUnit.ratio) || 1.0;
            const ratioStock = Number(stockUnit.ratio) || 1.0;
            if (ratioStock > 0) {
                requestedQty = line.qty * (ratioLine / ratioStock);
            }
        }

        const lotsData: LineLot[] = [];
        let totalAllocated = 0;

        Object.entries(allocatedLotsMap).forEach(([lotNumber, qty]) => {
            if (qty > 0) {
                const foundLot = availableLots.find(l => l.lot_number === lotNumber);
                lotsData.push({
                    lot_number: lotNumber,
                    quantity: qty,
                    fabrication_date: foundLot?.fabrication_date || null,
                    expiration_date: foundLot?.expiration_date || null,
                });
                totalAllocated += qty;
            }
        });

        // Verify total allocated matches order quantity
        if (Math.abs(totalAllocated - requestedQty) > 0.0001) {
            setLotModalError(`La quantité totale allouée (${totalAllocated}) doit être exactement égale à la quantité requise (${requestedQty}).`);
            return;
        }

        const updated = [...data.lines];
        updated[activeLineIndex].lots = lotsData;
        
        setData('lines', updated);
        setActiveLineIndex(null);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        // Final verification that all lot-managed products have complete allocations
        for (let i = 0; i < data.lines.length; i++) {
            const line = data.lines[i];
            const prod = products.find(p => p.id.toString() === line.product_id);
            if (prod?.manage_by_lot) {
                const activeUnitId = line.sale_unit_id || prod.sale_unit_id;
                const lineUnit = units.find(u => u.id.toString() === activeUnitId?.toString());
                const stockUnit = (prod as any).stock_unit;
                
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
                    showToast(`Veuillez allouer les lots pour la ligne n° ${i + 1} (${prod.label}) avant d'enregistrer.`);
                    return;
                }
            }
        }

        put(route('commandes.update', commande.id));
    };

    return (
        <AuthenticatedLayout header={
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 max-w-7xl mx-auto">
                <div>
                    <div className="flex items-center space-x-2 text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        <span>Ventes</span><span>/</span>
                        <span>Commandes</span><span>/</span>
                        <span className="text-indigo-600 dark:text-indigo-400">Modifier</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1.5">
                        Modifier la Commande Client: {commande.ref}
                    </h2>
                </div>
                <Link href={route('commandes.index')} className="px-5 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-750 transition-all">
                    Retour à la liste
                </Link>
            </div>
        }>
            <Head title={`Modifier la Commande ${commande.ref}`} />
            <form onSubmit={submit} className="max-w-7xl mx-auto space-y-6">
                {isReadOnly && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-[2rem] p-4 flex items-center space-x-3.5 mb-6 animate-fade-in animate-slide-in">
                        <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-450 border border-amber-500/20 flex items-center justify-center shrink-0">
                            <svg className="h-5 w-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-amber-800 dark:text-amber-400">Consultation en Lecture Seule</h4>
                            <p className="text-xs font-semibold text-amber-700 dark:text-amber-455 mt-0.5 leading-relaxed">
                                Cette commande est validée et verrouillée en écriture. Les modifications sont désactivées.
                            </p>
                        </div>
                    </div>
                )}
                
                {/* Commande Details */}
                <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl p-6 backdrop-blur-xl space-y-6">
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-850 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">1. Informations Générales</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Client <span className="text-rose-500">*</span></label>
                            <select className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-200 font-semibold"
                                value={data.tier_id} onChange={e => setData('tier_id', e.target.value)} required disabled={isReadOnly}>
                                <option value="">Sélectionner un client...</option>
                                {tiers.map(t => (
                                    <option key={t.id} value={t.id}>{t.label}</option>
                                ))}
                            </select>
                            <InputError message={errors.tier_id} className="mt-1" />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Commercial / Agent</label>
                            <select className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-200"
                                value={data.commercial} onChange={e => setData('commercial', e.target.value)} disabled={isReadOnly}>
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
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Date de Commande <span className="text-rose-500">*</span></label>
                            <input type="date" className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-200"
                                value={data.date_commande} onChange={e => setData('date_commande', e.target.value)} required disabled={isReadOnly} />
                            <InputError message={errors.date_commande} className="mt-1" />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Devise <span className="text-rose-500">*</span></label>
                            <select className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-200"
                                value={data.devise_id} onChange={e => setData('devise_id', e.target.value)} required disabled={isReadOnly}>
                                {devises.map(d => (
                                    <option key={d.id} value={d.id}>{d.label} ({d.symbol || d.code})</option>
                                ))}
                            </select>
                            <InputError message={errors.devise_id} className="mt-1" />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Branche <span className="text-rose-500">*</span></label>
                            <select className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-200 font-semibold"
                                value={data.branche_id} onChange={e => setData('branche_id', e.target.value)} disabled={isReadOnly} required>
                                <option value="">Sélectionner une branche...</option>
                                {branches.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                            <InputError message={errors.branche_id} className="mt-1" />
                        </div>
                    </div>
                </div>

                {/* Line Items Table identical to Devis */}
                <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl overflow-hidden p-6 backdrop-blur-xl space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-850 dark:text-white">2. Lignes de Commande</h3>
                        {!isReadOnly && (
                            <button type="button" onClick={addLine}
                                className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-2xl transition-all shadow-md shadow-indigo-500/10 active:scale-95">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                                <span>Ajouter un produit</span>
                            </button>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[1350px]">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800/50 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                                    <th className="pb-3 w-[260px] min-w-[260px]">Produit <span className="text-rose-500">*</span></th>
                                    <th className="pb-3 px-2 w-[180px] min-w-[180px]">Entrepôt <span className="text-rose-500">*</span></th>
                                    <th className="pb-3 px-2 w-[80px] min-w-[80px]">TVA %</th>
                                    <th className="pb-3 px-2 w-[110px] min-w-[110px]">Quantité</th>
                                    <th className="pb-3 px-2 w-[140px] min-w-[140px]">Unité</th>
                                    <th className="pb-3 px-2 w-[100px] min-w-[100px]">P.U. HT</th>
                                    <th className="pb-3 px-2 w-[100px] min-w-[100px]">P.U. TTC</th>
                                    <th className="pb-3 px-2 w-[85px] min-w-[85px]">Remise %</th>
                                    <th className="pb-3 px-2 w-[95px] min-w-[95px]">RM (Amt)</th>
                                    <th className="pb-3 text-right pr-2 w-[95px] min-w-[95px]">Total HT</th>
                                    <th className="pb-3 px-2 text-center w-[110px] min-w-[110px]">Lots</th>
                                    <th className="pb-3 w-12 text-center"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/50">
                                {data.lines.length === 0 ? (
                                    <tr>
                                        <td colSpan={12} className="py-12 text-center text-xs text-slate-400 font-medium">
                                            Aucun produit ajouté. Cliquez sur "Ajouter un produit" pour commencer.
                                        </td>
                                    </tr>
                                ) : data.lines.map((line, idx) => {
                                    const selectedProd = products.find(p => p.id.toString() === line.product_id);
                                    const isLotManaged = selectedProd?.manage_by_lot || false;
                                    const isLotsFullyAllocated = (() => {
                                        if (!line.lots || line.lots.length === 0) return false;
                                        const allocated = line.lots.reduce((sum, l) => sum + l.quantity, 0);
                                        
                                        // Compute converted quantity
                                        let targetQty = line.qty;
                                        if (selectedProd) {
                                            const activeUnitId = line.sale_unit_id || selectedProd.sale_unit_id;
                                            const lineUnit = units.find(u => u.id.toString() === activeUnitId?.toString());
                                            const stockUnit = (selectedProd as any).stock_unit;
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
                                        <tr key={idx} className="group hover:bg-slate-50/20 dark:hover:bg-slate-850/5 transition-all">
                                            <td className="py-3 pr-2">
                                                <select className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-2 px-3 focus:outline-none focus:border-indigo-500 transition-all font-semibold"
                                                    value={line.product_id} onChange={e => updateLineField(idx, 'product_id', e.target.value)} required disabled={isReadOnly}>
                                                    <option value="">Choisir...</option>
                                                    {products.map(p => (
                                                        <option key={p.id} value={p.id}>{p.ref ? `[${p.ref}] ` : ''}{p.label} (P.U: {formatMoney(Number(p.sale_price))})</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="py-3 px-2">
                                                <select className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-2 px-3 focus:outline-none focus:border-indigo-500 transition-all"
                                                    value={line.entrepot_id} onChange={e => updateLineField(idx, 'entrepot_id', e.target.value)} required disabled={isReadOnly}>
                                                    {entrepots.map(ent => (
                                                        <option key={ent.id} value={ent.id}>{ent.label} ({ent.code})</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="py-3 px-2">
                                                <select className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-2 px-3 focus:outline-none focus:border-indigo-500 font-semibold disabled:opacity-50"
                                                    value={line.taux_tva_id} onChange={e => updateLineField(idx, 'taux_tva_id', e.target.value)} required disabled={isReadOnly}>
                                                    <option value="">TVA...</option>
                                                    {(tauxTvas || []).map(t => (
                                                        <option key={t.id} value={t.id}>{t.taux}%</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="py-3 px-2">
                                                <input type="number" step="0.0001" className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-2 px-3 focus:outline-none focus:border-indigo-500 font-semibold"
                                                    value={line.qty} onChange={e => updateLineField(idx, 'qty', e.target.value)} required disabled={isReadOnly} />
                                                {(commande.lines[idx] as any)?.qty_livre > 0 && (
                                                    <div className="text-[10px] text-emerald-600 dark:text-emerald-450 mt-1 font-bold select-none leading-none">
                                                        Livré: {(commande.lines[idx] as any).qty_livre}
                                                    </div>
                                                )}
                                                {(() => {
                                                    if (!selectedProd) return null;
                                                    const activeUnitId = line.sale_unit_id || selectedProd.sale_unit_id;
                                                    const lineUnit = units.find(u => u.id.toString() === activeUnitId?.toString());
                                                    const stockUnit = (selectedProd as any).stock_unit;
                                                    if (!stockUnit || !lineUnit || lineUnit.id === stockUnit.id) return null;

                                                    const ratioLine = Number(lineUnit.ratio) || 1.0;
                                                    const ratioStock = Number(stockUnit.ratio) || 1.0;
                                                    const convertedQty = ratioStock > 0 ? (line.qty * (ratioLine / ratioStock)) : line.qty;

                                                    return (
                                                        <div className="text-[10px] text-indigo-500 dark:text-indigo-400 mt-1 font-extrabold select-none leading-none">
                                                            = {convertedQty.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })} {stockUnit.code}
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                            <td className="py-3 px-2">
                                                <select className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-2 px-3 focus:outline-none focus:border-indigo-500 transition-all font-semibold"
                                                    value={line.sale_unit_id} onChange={e => updateLineField(idx, 'sale_unit_id', e.target.value)} disabled={isReadOnly}>
                                                    <option value="">Standard</option>
                                                    {units
                                                        .filter(u => !selectedProd || u.unit_category_id === (selectedProd as any).unit_category_id)
                                                        .map(u => (
                                                            <option key={u.id} value={u.id}>{u.label} ({u.code})</option>
                                                        ))}
                                                </select>
                                            </td>
                                            <td className="py-3 px-2">
                                                <DecimalInput value={line.pu_ht} onChange={val => updateLineField(idx, 'pu_ht', val)} decimals={decimals} className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-2 px-3 focus:outline-none focus:border-indigo-500 font-semibold" required disabled={isReadOnly} />
                                            </td>
                                            <td className="py-3 px-2">
                                                <DecimalInput value={line.pu_ttc} onChange={val => updateLineField(idx, 'pu_ttc', val)} decimals={decimals} className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-2 px-3 focus:outline-none focus:border-indigo-500 font-semibold" required disabled={isReadOnly} />
                                            </td>
                                            <td className="py-3 px-2">
                                                <input type="number" step="0.01" className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-2 px-3 focus:outline-none focus:border-indigo-500"
                                                    value={line.remise} onChange={e => updateLineField(idx, 'remise', e.target.value)} disabled={isReadOnly} />
                                            </td>
                                            <td className="py-3 px-2">
                                                <DecimalInput value={line.rm} onChange={val => updateLineField(idx, 'rm', val)} decimals={decimals} className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-2 px-3 focus:outline-none focus:border-indigo-500" disabled={isReadOnly} />
                                            </td>
                                            <td className="py-3 text-right pr-2 font-mono text-xs font-black text-slate-800 dark:text-slate-100 select-none">
                                                {formatMoney(line.total_ht)}
                                            </td>
                                            <td className="py-3 px-2 text-center">
                                                {isLotManaged ? (
                                                    <button type="button" onClick={() => openLotModal(idx)}
                                                        className={`inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-[9px] font-extrabold uppercase tracking-widest transition-all cursor-pointer ${
                                                            isLotsFullyAllocated 
                                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/20'
                                                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-450 border border-amber-500/20'
                                                        }`}>
                                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                                        <span>{isLotsFullyAllocated ? 'Lots Ok' : 'Allouer'}</span>
                                                    </button>
                                                ) : (
                                                    <span className="text-[10px] text-slate-400 font-bold italic">—</span>
                                                )}
                                            </td>
                                            <td className="py-3 text-center">
                                                <button type="button" onClick={() => removeLine(idx)} disabled={isReadOnly}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-all disabled:opacity-30">
                                                    <svg className="h-4 w-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
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
                                    Une fois cette commande enregistrée, son statut initial sera défini comme <span className="font-bold text-indigo-500">Brouillon</span>. Vous pourrez ensuite la marquer comme Validée et déclencher le retrait du stock depuis la liste des commandes.
                                </p>
                            </div>
                            <div className="flex items-center space-x-3 pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
                                <Link href={route('commandes.index')} className="px-5 py-2.5 text-xs font-bold text-slate-655 dark:text-slate-455 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-250 dark:hover:bg-slate-750 transition-all select-none">
                                    {isReadOnly ? 'Retour' : 'Annuler'}
                                </Link>
                                {!isReadOnly && (
                                    <button type="submit" disabled={processing || data.lines.length === 0}
                                        className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl active:scale-[0.97] transition-all disabled:opacity-50 select-none">
                                        Enregistrer les Modifications
                                    </button>
                                )}
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
                                    {formatMoney(totalHT + totalRemise)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-rose-455">
                                <span>Total Remise</span>
                                <span className="font-mono text-rose-450 text-sm font-bold">
                                    - {formatMoney(totalRemise)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-slate-400">
                                <span>Total Net HT</span>
                                <span className="font-mono text-white text-sm font-bold">
                                    {formatMoney(totalHT)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-slate-400">
                                <span>Total TVA</span>
                                <span className="font-mono text-white text-sm font-bold">
                                    {formatMoney(totalTVA)}
                                </span>
                            </div>
                            <div className="pt-4 border-t border-slate-850 flex items-center justify-between text-base">
                                <span className="text-indigo-400 font-extrabold">TOTAL TTC</span>
                                <span className="font-mono font-black text-white text-xl">
                                    {formatMoney(totalTTC)} <span className="text-xs text-slate-450">{devises.find(d => d.id.toString() === data.devise_id)?.symbol || devises.find(d => d.id.toString() === data.devise_id)?.code || ''}</span>
                                </span>
                            </div>
                        </div>

                        <div className="text-[10px] text-slate-500 font-medium text-center select-none pt-2 border-t border-slate-850">
                            Calculé en temps réel • Arrondi à {decimals} décimales par ligne
                        </div>
                    </div>
                </div>
            </form>

            {/* Dynamic Lot Allocation Modal */}
            {activeLineIndex !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-[2.5rem] shadow-3xl p-6 lg:p-8 transform transition-all max-h-[85vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-4 mb-6">
                            <div>
                                <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-855 dark:text-white">
                                    Allocation des lots
                                </h3>
                                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">
                                    Produit: {products.find(p => p.id.toString() === data.lines[activeLineIndex].product_id)?.label}
                                </p>
                            </div>
                            <button type="button" onClick={() => setActiveLineIndex(null)}
                                className="p-1.5 text-slate-400 hover:text-slate-655 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all">
                                <svg className="h-5 w-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {lotModalError && (
                            <div className="mb-4 p-3.5 bg-rose-50 dark:bg-rose-950/35 border border-rose-100 dark:border-rose-900/50 text-rose-650 dark:text-rose-400 rounded-2xl text-xs font-bold leading-normal">
                                {lotModalError}
                            </div>
                        )}

                        {(() => {
                            const line = data.lines[activeLineIndex];
                            const product = products.find(p => p.id.toString() === line.product_id);
                            const activeUnitId = line.sale_unit_id || product?.sale_unit_id;
                            const lineUnit = units.find(u => u.id.toString() === activeUnitId?.toString());
                            const stockUnit = (product as any)?.stock_unit;
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
                                            {Object.values(allocatedLotsMap).reduce((s, q) => s + q, 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })} {unitCode}
                                        </span>
                                    </div>
                                </div>
                            );
                        })()}

                        {isLoadingLots ? (
                            <div className="py-12 flex flex-col items-center justify-center space-y-3">
                                <svg className="animate-spin h-6 w-6 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Chargement des lots...</span>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {availableLots.length === 0 ? (
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
                                            {availableLots.map(lot => (
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
                                                            value={allocatedLotsMap[lot.lot_number] || ''}
                                                            onChange={e => handleUpdateLotQty(lot.lot_number, e.target.value)}
                                                            disabled={isReadOnly} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Formulaire d'ajout de lot manuel */}
                                {!isReadOnly && (
                                    <div className="pt-5 border-t border-slate-100 dark:border-slate-800/60 mt-4">
                                        <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-450 dark:text-slate-400 mb-3">
                                            Ajouter un lot manuellement
                                        </h4>
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
                                            <div>
                                                <label className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-450 mb-1.5 font-sans">N° Lot</label>
                                                <input type="text" placeholder="Ex: LOT-2026-001"
                                                    className="block w-full rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/40 text-xs py-2.5 px-3 focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200 font-bold"
                                                    value={manualLotNumber} onChange={e => setManualLotNumber(e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-450 mb-1.5 font-sans">Qté à Allouer</label>
                                                <input type="number" step="any" min="0" placeholder="0.00"
                                                    className="block w-full rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/40 text-xs py-2.5 px-3 text-right focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200 font-bold"
                                                    value={manualLotQty} onChange={e => setManualLotQty(e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-450 mb-1.5 font-sans">Date Fab.</label>
                                                <input type="date"
                                                    className="block w-full rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/40 text-xs py-2 px-3 focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200 font-bold font-mono"
                                                    value={manualFabricationDate} onChange={e => setManualFabricationDate(e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-450 mb-1.5 font-sans">Date Exp.</label>
                                                <input type="date"
                                                    className="block w-full rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/40 text-xs py-2 px-3 focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200 font-bold font-mono"
                                                    value={manualExpirationDate} onChange={e => setManualExpirationDate(e.target.value)} />
                                            </div>
                                            <button type="button" onClick={addManualLot}
                                                className="w-full sm:w-auto h-[38px] inline-flex items-center justify-center space-x-1.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all active:scale-[0.97] col-span-2 md:col-span-1">
                                                <svg className="h-4 w-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                                </svg>
                                                <span>Ajouter</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex items-center justify-end space-x-3 pt-6 mt-6 border-t border-slate-100 dark:border-slate-800/60">
                            <button type="button" onClick={() => setActiveLineIndex(null)}
                                className="px-5 py-2.5 text-xs font-bold text-slate-655 dark:text-slate-355 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-750 transition-all">
                                {isReadOnly ? 'Fermer' : 'Annuler'}
                            </button>
                            {!isReadOnly && (
                                <button type="button" onClick={saveLotsAllocation} disabled={isLoadingLots}
                                    className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl transition-all shadow-md shadow-indigo-500/20 active:scale-[0.97]">
                                    Enregistrer
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

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
