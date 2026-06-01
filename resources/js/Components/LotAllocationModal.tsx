import { useState, useEffect } from 'react';

export interface LineLot {
    lot_number: string;
    quantity: number;
    fabrication_date?: string | null;
    expiration_date?: string | null;
}

interface AvailableLot {
    id: number;
    lot_number: string;
    quantity: number;
    fabrication_date: string | null;
    expiration_date: string | null;
}

interface LotAllocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    productName: string;
    productId: number | string;
    entrepotId: number | string;
    requestedQty: number;
    unitCode: string;
    initialLots: LineLot[];
    onConfirm: (allocatedLots: LineLot[]) => void;
    isLocked?: boolean;
    allowManualLots?: boolean;
}

export default function LotAllocationModal({
    isOpen,
    onClose,
    productName,
    productId,
    entrepotId,
    requestedQty,
    unitCode,
    initialLots,
    onConfirm,
    isLocked = false,
    allowManualLots = true,
}: LotAllocationModalProps) {
    if (!isOpen) return null;

    const [availableLots, setAvailableLots] = useState<AvailableLot[]>([]);
    const [isLoadingLots, setIsLoadingLots] = useState(false);
    const [allocatedLotsMap, setAllocatedLotsMap] = useState<Record<string, number>>({});
    const [lotModalError, setLotModalError] = useState<string | null>(null);

    const [manualLotNumber, setManualLotNumber] = useState('');
    const [manualLotQty, setManualLotQty] = useState('');
    const [manualFabricationDate, setManualFabricationDate] = useState('');
    const [manualExpirationDate, setManualExpirationDate] = useState('');

    useEffect(() => {
        setIsLoadingLots(true);
        setLotModalError(null);

        const currentMap: Record<string, number> = {};
        initialLots.forEach(lot => {
            currentMap[lot.lot_number] = lot.quantity;
        });
        setAllocatedLotsMap(currentMap);

        fetch(`/api/entrepot-lots?product_id=${productId}&entrepot_id=${entrepotId}`)
            .then(res => res.json())
            .then((data: AvailableLot[]) => {
                const fetchedNumbers = new Set(data.map(l => l.lot_number.toLowerCase()));
                const missingInjected: AvailableLot[] = [];

                initialLots.forEach(lot => {
                    if (!fetchedNumbers.has(lot.lot_number.toLowerCase())) {
                        missingInjected.push({
                            id: -Date.now() - Math.random(),
                            lot_number: lot.lot_number,
                            quantity: allowManualLots ? 999999 : lot.quantity,
                            fabrication_date: lot.fabrication_date || null,
                            expiration_date: lot.expiration_date || null
                        });
                    }
                });

                setAvailableLots([...data, ...missingInjected]);
                setIsLoadingLots(false);
            })
            .catch(() => {
                setLotModalError('Impossible de récupérer les lots disponibles.');
                setIsLoadingLots(false);
            });
    }, [productId, entrepotId, initialLots]);

    const handleUpdateLotQty = (lotNumber: string, value: string) => {
        if (isLocked) return;
        const qty = Math.max(0, Number(value) || 0);
        setAllocatedLotsMap(prev => ({ ...prev, [lotNumber]: qty }));
    };

    const addManualLot = () => {
        if (isLocked || !allowManualLots) return;

        if (!manualLotNumber.trim()) {
            setLotModalError("Le numéro de lot ne peut pas être vide.");
            return;
        }
        const qty = Number(manualLotQty) || 0;
        if (qty <= 0) {
            setLotModalError("La quantité doit être supérieure à 0.");
            return;
        }
        if (availableLots.some(l => l.lot_number.toLowerCase() === manualLotNumber.trim().toLowerCase())) {
            setLotModalError("Ce lot existe déjà dans la liste.");
            return;
        }

        const newLot: AvailableLot = {
            id: -Date.now(),
            lot_number: manualLotNumber.trim(),
            quantity: 999999,
            fabrication_date: manualFabricationDate || null,
            expiration_date: manualExpirationDate || null
        };

        setAvailableLots(prev => [...prev, newLot]);
        setAllocatedLotsMap(prev => ({ ...prev, [newLot.lot_number]: qty }));
        setManualLotNumber('');
        setManualLotQty('');
        setManualFabricationDate('');
        setManualExpirationDate('');
        setLotModalError(null);
    };

    const handleConfirm = () => {
        if (isLocked) { onClose(); return; }

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

        if (Math.abs(totalAllocated - requestedQty) > 0.0001) {
            setLotModalError(`La quantité totale allouée (${totalAllocated}) doit être exactement égale à la quantité requise (${requestedQty}).`);
            return;
        }

        onConfirm(lotsData);
    };

    const handleDeleteLocalLot = (lotId: number, lotNumber: string) => {
        setAvailableLots(prev => prev.filter(l => l.id !== lotId));
        setAllocatedLotsMap(prev => { const next = { ...prev }; delete next[lotNumber]; return next; });
    };

    const handleDeleteDbLot = (lotId: number, lotNumber: string) => {
        if (!confirm(`Voulez-vous vraiment supprimer définitivement le lot "${lotNumber}" de la base de données ?`)) return;

        fetch(`/api/entrepot-lots/${lotId}`, {
            method: 'DELETE',
            headers: {
                'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then((result) => {
                if (result.success) {
                    setAvailableLots(prev => prev.filter(l => l.id !== lotId));
                    setAllocatedLotsMap(prev => { const next = { ...prev }; delete next[lotNumber]; return next; });
                } else {
                    setLotModalError(result.message || 'Impossible de supprimer le lot.');
                }
            })
            .catch(() => setLotModalError('Erreur de connexion au serveur.'));
    };

    const totalAllocatedSum = Object.values(allocatedLotsMap).reduce((s, q) => s + q, 0);
    const allocationProgress = requestedQty > 0 ? Math.min((totalAllocatedSum / requestedQty) * 100, 100) : 0;
    const isComplete = Math.abs(totalAllocatedSum - requestedQty) <= 0.0001;
    const isOver = totalAllocatedSum > requestedQty + 0.0001;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(2, 6, 23, 0.75)', backdropFilter: 'blur(8px)' }}>

            {/* Modal Container */}
            <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-white dark:bg-gray-950 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800/60">

                {/* Top accent bar */}
                <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500 flex-shrink-0" />

                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800/70 flex-shrink-0">
                    <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">
                                Allocation des lots
                            </h2>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-medium">
                                {productName}
                            </p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                    {/* Error */}
                    {lotModalError && (
                        <div className="flex items-start gap-2.5 p-3.5 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl">
                            <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                            </svg>
                            <p className="text-xs font-semibold text-red-600 dark:text-red-400 leading-relaxed">{lotModalError}</p>
                        </div>
                    )}

                    {/* Progress Card */}
                    <div className="rounded-2xl border border-gray-100 dark:border-gray-800/70 bg-gray-50 dark:bg-gray-900/60 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Progression</span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${isComplete
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                                    : isOver
                                        ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'
                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'
                                    }`}>
                                    {isComplete ? '✓ Complet' : isOver ? '⚠ Dépassé' : 'En cours'}
                                </span>
                            </div>
                            <div className="text-right">
                                <span className={`text-sm font-bold ${isComplete ? 'text-emerald-600 dark:text-emerald-400' : isOver ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-gray-200'}`}>
                                    {totalAllocatedSum.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })}
                                </span>
                                <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                                    {' '}/ {requestedQty.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })} {unitCode}
                                </span>
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-300 ${isComplete ? 'bg-emerald-500' : isOver ? 'bg-red-500' : 'bg-indigo-500'}`}
                                style={{ width: `${allocationProgress}%` }}
                            />
                        </div>

                        <div className="flex justify-between mt-2">
                            <span className="text-[10px] text-gray-400 font-medium">0</span>
                            <span className="text-[10px] text-gray-400 font-medium">{requestedQty.toLocaleString()} {unitCode}</span>
                        </div>
                    </div>

                    {/* Lots Table */}
                    {isLoadingLots ? (
                        <div className="py-16 flex flex-col items-center justify-center gap-3">
                            <div className="w-8 h-8 border-2 border-indigo-200 dark:border-indigo-800 border-t-indigo-500 rounded-full animate-spin" />
                            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">Chargement des lots...</span>
                        </div>
                    ) : availableLots.length === 0 ? (
                        <div className="py-14 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                            <div className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                            <p className="text-xs font-semibold text-gray-400">Aucun lot disponible dans l'entrepôt</p>
                        </div>
                    ) : (
                        <div>
                            {/* Table Header */}
                            <div className="hidden md:grid grid-cols-[1fr_110px_130px_120px_40px] gap-3 px-4 mb-2">
                                {['N° Lot', 'Stock', 'Expiration', 'Quantité', ''].map((h, i) => (
                                    <span key={i} className={`text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 ${i === 3 ? 'text-right' : ''}`}>{h}</span>
                                ))}
                            </div>

                            {/* Rows */}
                            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-0.5">
                                {availableLots.map(lot => {
                                    const maxAllowed = allowManualLots ? undefined : lot.quantity;
                                    const allocQty = allocatedLotsMap[lot.lot_number] || 0;
                                    const hasAllocation = allocQty > 0;

                                    return (
                                        <div key={lot.id}
                                            className={`grid grid-cols-1 md:grid-cols-[1fr_110px_130px_120px_40px] gap-3 items-center px-4 py-3.5 rounded-2xl border transition-all ${hasAllocation
                                                ? 'bg-indigo-50/60 dark:bg-indigo-500/5 border-indigo-200/70 dark:border-indigo-500/20'
                                                : 'bg-white dark:bg-gray-900/40 border-gray-100 dark:border-gray-800/60 hover:border-gray-200 dark:hover:border-gray-700'
                                                }`}>

                                            {/* Lot number */}
                                            <div className="flex items-center gap-2">
                                                {hasAllocation && (
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                                                )}
                                                <span className="text-xs font-bold text-gray-800 dark:text-gray-200 font-mono">
                                                    {lot.lot_number}
                                                </span>
                                            </div>

                                            {/* Stock */}
                                            <div className="flex items-center gap-1.5 md:block">
                                                <span className="text-[9px] font-bold uppercase text-gray-400 md:hidden">Stock :</span>
                                                <span className={`text-xs font-semibold ${lot.quantity === 999999 ? 'text-violet-600 dark:text-violet-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                                    {lot.quantity === 999999 ? 'Nouveau' : `${lot.quantity}`}
                                                </span>
                                            </div>

                                            {/* Expiration */}
                                            <div className="flex items-center gap-1.5 md:block">
                                                <span className="text-[9px] font-bold uppercase text-gray-400 md:hidden">Exp. :</span>
                                                <span className="text-xs font-medium text-gray-400 dark:text-gray-500 font-mono">
                                                    {lot.expiration_date || '—'}
                                                </span>
                                            </div>

                                            {/* Qty input */}
                                            <div>
                                                <input
                                                    type="number" step="any" min="0" max={maxAllowed}
                                                    disabled={isLocked} placeholder="0"
                                                    className={`block w-full rounded-xl border text-xs py-2 px-3 text-right font-bold transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${hasAllocation
                                                        ? 'border-indigo-300 dark:border-indigo-600/50 bg-white dark:bg-gray-900 text-indigo-700 dark:text-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                                                        : 'border-gray-200 dark:border-gray-700/80 bg-gray-50 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15'
                                                        }`}
                                                    value={allocatedLotsMap[lot.lot_number] || ''}
                                                    onChange={e => handleUpdateLotQty(lot.lot_number, e.target.value)}
                                                />
                                            </div>

                                            {/* Delete */}
                                            <div className="flex items-center justify-center">
                                                {lot.id < 0 && !isLocked && (
                                                    <button type="button" onClick={() => handleDeleteLocalLot(lot.id, lot.lot_number)}
                                                        title="Retirer ce lot"
                                                        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                )}
                                                {lot.id > 0 && lot.quantity <= 0.0001 && !isLocked && (
                                                    <button type="button" onClick={() => handleDeleteDbLot(lot.id, lot.lot_number)}
                                                        title="Supprimer de la base"
                                                        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Manual Lot Entry */}
                    {allowManualLots && !isLocked && (
                        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-5 h-5 rounded-md bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center">
                                    <svg className="w-3 h-3 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                <h4 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                    Ajouter un lot manuellement
                                </h4>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">N° Lot</label>
                                    <input type="text" placeholder="LOT-2026-001"
                                        className="block w-full rounded-xl border border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-900 text-xs py-2.5 px-3 font-semibold text-gray-800 dark:text-gray-200 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:border-violet-400 dark:focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15 transition-all"
                                        value={manualLotNumber} onChange={e => setManualLotNumber(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">Quantité</label>
                                    <input type="number" step="any" min="0" placeholder="0.00"
                                        className="block w-full rounded-xl border border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-900 text-xs py-2.5 px-3 text-right font-semibold text-gray-800 dark:text-gray-200 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:border-violet-400 dark:focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15 transition-all"
                                        value={manualLotQty} onChange={e => setManualLotQty(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">Date Fab.</label>
                                    <input type="date"
                                        className="block w-full rounded-xl border border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-900 text-xs py-2.5 px-3 font-semibold text-gray-800 dark:text-gray-200 focus:outline-none focus:border-violet-400 dark:focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15 transition-all"
                                        value={manualFabricationDate} onChange={e => setManualFabricationDate(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">Date Exp.</label>
                                    <input type="date"
                                        className="block w-full rounded-xl border border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-900 text-xs py-2.5 px-3 font-semibold text-gray-800 dark:text-gray-200 focus:outline-none focus:border-violet-400 dark:focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15 transition-all"
                                        value={manualExpirationDate} onChange={e => setManualExpirationDate(e.target.value)} />
                                </div>
                            </div>

                            <button type="button" onClick={addManualLot}
                                className="w-full h-9 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 active:scale-[0.98] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm shadow-violet-500/20">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                                Ajouter le lot
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800/70 bg-gray-50/50 dark:bg-gray-900/40 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isComplete ? 'bg-emerald-500' : isOver ? 'bg-red-500' : 'bg-amber-400'}`} />
                        <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">
                            {isComplete ? 'Allocation complète' : isOver ? 'Quantité dépassée' : `Reste : ${(requestedQty - totalAllocatedSum).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })} ${unitCode}`}
                        </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <button type="button" onClick={onClose}
                            className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-750 transition-all">
                            {isLocked ? 'Fermer' : 'Annuler'}
                        </button>
                        {!isLocked && (
                            <button type="button" onClick={handleConfirm}
                                className={`px-5 py-2 text-xs font-bold text-white rounded-xl transition-all shadow-sm active:scale-[0.97] ${isComplete
                                    ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'
                                    : 'bg-indigo-400 dark:bg-indigo-700 opacity-70 cursor-not-allowed'
                                    }`}>
                                Confirmer l'allocation
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}