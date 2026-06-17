import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage, useForm } from '@inertiajs/react';
import { useState, useEffect, useMemo } from 'react';
import Modal from '@/Components/Modal';

interface JournalComptable { id: number; code: string; libelle: string; }
interface PeriodeComptable { id: number; code: string; libelle: string; date_debut: string; date_fin: string; statut: string; }
interface ExerciceComptable { id: number; code: string; libelle: string; statut: string; periodes: PeriodeComptable[]; }
interface PlanComptable { id: number; numero: string; libelle: string; parent_id: number | null; }
interface EcritureComptable {
    id: number;
    jour: number;
    numero_piece: string;
    numero_facture: string | null;
    plan_comptable_id: number;
    plan_comptable: PlanComptable;
    compte_tier_id: number | null;
    compteTier: PlanComptable | null;
    libelle: string;
    date_echeance: string | null;
    debit: number;
    credit: number;
}

export default function Index({
    journaux, exercices, comptes_generaux, comptes_tiers, ecritures, filters
}: {
    journaux: JournalComptable[], exercices: ExerciceComptable[], comptes_generaux: PlanComptable[], comptes_tiers: PlanComptable[], ecritures: EcritureComptable[],
    filters: { journal_id: string, exercice_id: string, periode_id: string }
}) {
    const { flash } = usePage().props as any;
    const [localFlash, setLocalFlash] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        if (flash?.success) {
            setLocalFlash({ type: 'success', message: flash.success });
            const t = setTimeout(() => setLocalFlash(null), 5000);
            return () => clearTimeout(t);
        } else if (flash?.error) {
            setLocalFlash({ type: 'error', message: flash.error });
            const t = setTimeout(() => setLocalFlash(null), 7000);
            return () => clearTimeout(t);
        }
    }, [flash]);

    const headerForm = useForm({
        journal_id: filters.journal_id || '',
        exercice_id: filters.exercice_id || '',
        periode_id: filters.periode_id || '',
    });

    const activeExercice = exercices.find(e => String(e.id) === String(headerForm.data.exercice_id));
    const activePeriodes = activeExercice ? activeExercice.periodes : [];

    const handleHeaderChange = (field: 'journal_id' | 'exercice_id' | 'periode_id', value: string) => {
        headerForm.setData(field, value);
        
        let newJournal = field === 'journal_id' ? value : headerForm.data.journal_id;
        let newExercice = field === 'exercice_id' ? value : headerForm.data.exercice_id;
        let newPeriode = field === 'periode_id' ? value : (field === 'exercice_id' ? '' : headerForm.data.periode_id);

        if (newJournal && newExercice && newPeriode) {
            router.get(route('saisie-ecritures.index'), {
                journal_id: newJournal,
                exercice_id: newExercice,
                periode_id: newPeriode
            }, { preserveState: true, preserveScroll: true, replace: true });
        } else if (field === 'exercice_id') {
            headerForm.setData('periode_id', '');
        }
    };

    const handleDelete = (id: number) => {
        if (confirm("Voulez-vous vraiment supprimer cette ligne ?")) {
            router.delete(route('saisie-ecritures.destroy', id), { preserveScroll: true });
        }
    };

    // ------------- MODAL STATE -------------
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const [pieceForm, setPieceForm] = useState({
        jour: '',
        numero_piece: '',
        numero_facture: '',
        lignes: [] as any[],
    });

    // Temp line input inside the modal
    const [tempLine, setTempLine] = useState({
        plan_comptable_id: '',
        compte_tier_id: '',
        libelle: '',
        date_echeance: '',
        debit: '0',
        credit: '0'
    });

    const openModal = () => {
        setPieceForm({
            jour: '',
            numero_piece: '',
            numero_facture: '',
            lignes: []
        });
        setTempLine({
            plan_comptable_id: '',
            compte_tier_id: '',
            libelle: '',
            date_echeance: '',
            debit: '0',
            credit: '0'
        });
        setIsModalOpen(true);
    };

    const handleCompteTiersChange = (val: string) => {
        const selectedCompteTiers = comptes_tiers.find(c => String(c.id) === val);
        if (selectedCompteTiers && selectedCompteTiers.parent_id) {
            setTempLine({ ...tempLine, compte_tier_id: val, plan_comptable_id: String(selectedCompteTiers.parent_id) });
        } else {
            setTempLine({ ...tempLine, compte_tier_id: val });
        }
    };

    const addTempLine = () => {
        if (!tempLine.plan_comptable_id || !tempLine.libelle) {
            alert('Veuillez remplir le compte et le libellé de la ligne.');
            return;
        }
        if (Number(tempLine.debit) === 0 && Number(tempLine.credit) === 0) {
            alert('Veuillez spécifier un montant (Débit ou Crédit).');
            return;
        }
        setPieceForm(prev => ({
            ...prev,
            lignes: [...prev.lignes, { ...tempLine, id: Date.now() }]
        }));
        setTempLine({
            plan_comptable_id: '',
            compte_tier_id: '',
            libelle: tempLine.libelle, // Keep libelle for next line usually
            date_echeance: '',
            debit: '0',
            credit: '0'
        });
    };

    const removeLine = (id: number) => {
        setPieceForm(prev => ({
            ...prev,
            lignes: prev.lignes.filter(l => l.id !== id)
        }));
    };

    const totalPieceDebit = useMemo(() => pieceForm.lignes.reduce((sum, l) => sum + Number(l.debit), 0), [pieceForm.lignes]);
    const totalPieceCredit = useMemo(() => pieceForm.lignes.reduce((sum, l) => sum + Number(l.credit), 0), [pieceForm.lignes]);
    const isPieceBalanced = totalPieceDebit > 0 && totalPieceCredit > 0 && Math.abs(totalPieceDebit - totalPieceCredit) < 0.01;

    const pieceFormInertia = useForm({
        journal_comptable_id: '',
        exercice_comptable_id: '',
        periode_comptable_id: '',
        jour: '',
        numero_piece: '',
        numero_facture: '',
        lignes: [] as any[]
    });

    const handleSavePiece = () => {
        if (!pieceForm.jour || !pieceForm.numero_piece) {
            alert('Veuillez renseigner le Jour et le N° de pièce.');
            return;
        }
        if (pieceForm.lignes.length < 2) {
            alert('Une pièce doit contenir au moins 2 lignes.');
            return;
        }
        if (!isPieceBalanced) {
            alert('La pièce n\'est pas équilibrée.');
            return;
        }

        pieceFormInertia.transform((data) => ({
            journal_comptable_id: headerForm.data.journal_id,
            exercice_comptable_id: headerForm.data.exercice_id,
            periode_comptable_id: headerForm.data.periode_id,
            jour: pieceForm.jour,
            numero_piece: pieceForm.numero_piece,
            numero_facture: pieceForm.numero_facture,
            lignes: pieceForm.lignes
        }));
        
        pieceFormInertia.post(route('saisie-ecritures.store'), {
            preserveScroll: true,
            onSuccess: () => {
                setIsModalOpen(false);
            }
        });
    };

    // Calculate totals for main view
    const totalDebit = useMemo(() => ecritures.reduce((sum, item) => sum + Number(item.debit), 0), [ecritures]);
    const totalCredit = useMemo(() => ecritures.reduce((sum, item) => sum + Number(item.credit), 0), [ecritures]);
    const solde = totalDebit - totalCredit;
    const isBalanced = Math.abs(solde) < 0.01;

    return (
        <AuthenticatedLayout header={
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 max-w-7xl mx-auto">
                <div>
                    <div className="flex items-center space-x-2 text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        <span>Comptabilité</span><span>/</span>
                        <span className="text-indigo-600 dark:text-indigo-400">Saisie d'Écritures</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1.5">Saisie des Écritures</h2>
                </div>
                {filters.journal_id && filters.exercice_id && filters.periode_id && (
                    <button onClick={openModal} className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-xl font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 active:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150 shadow-sm shadow-indigo-500/20">
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                        Ajouter Pièce
                    </button>
                )}
            </div>
        }>
            <Head title="Saisie d'Écritures" />

            <div className="max-w-[1400px] mx-auto space-y-6 pb-12">
                
                {/* Header Filters */}
                <div className="bg-white dark:bg-slate-900 shadow-sm border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 flex flex-wrap gap-6 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-[10px] font-black text-slate-455 uppercase tracking-widest mb-1.5">Journal</label>
                        <select value={headerForm.data.journal_id} onChange={e => handleHeaderChange('journal_id', e.target.value)}
                            className="w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50/40 dark:bg-slate-950/40 text-xs font-bold text-slate-850 dark:text-slate-200 py-3 px-4 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all">
                            <option value="">-- Sélectionner --</option>
                            {journaux.map(j => <option key={j.id} value={j.id}>{j.code} - {j.libelle}</option>)}
                        </select>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-[10px] font-black text-slate-455 uppercase tracking-widest mb-1.5">Exercice</label>
                        <select value={headerForm.data.exercice_id} onChange={e => handleHeaderChange('exercice_id', e.target.value)}
                            className="w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50/40 dark:bg-slate-950/40 text-xs font-bold text-slate-850 dark:text-slate-200 py-3 px-4 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all">
                            <option value="">-- Sélectionner --</option>
                            {exercices.map(e => <option key={e.id} value={e.id}>{e.libelle} ({e.statut})</option>)}
                        </select>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-[10px] font-black text-slate-455 uppercase tracking-widest mb-1.5">Période</label>
                        <select value={headerForm.data.periode_id} onChange={e => handleHeaderChange('periode_id', e.target.value)} disabled={!activeExercice}
                            className="w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50/40 dark:bg-slate-950/40 text-xs font-bold text-slate-850 dark:text-slate-200 py-3 px-4 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 transition-all">
                            <option value="">-- Sélectionner --</option>
                            {activePeriodes.map(p => <option key={p.id} value={p.id}>{p.libelle}</option>)}
                        </select>
                    </div>
                </div>

                {filters.journal_id && filters.exercice_id && filters.periode_id && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-sm">
                        
                        <div className="overflow-x-auto min-h-[400px]">
                            <table className="w-full text-left whitespace-nowrap">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800">
                                        <th className="py-3 px-5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Jour</th>
                                        <th className="py-3 px-5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">N° pièce</th>
                                        <th className="py-3 px-5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">N° facture</th>
                                        <th className="py-3 px-5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Compte général</th>
                                        <th className="py-3 px-5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Compte tiers</th>
                                        <th className="py-3 px-5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 w-full">Libellé écriture</th>
                                        <th className="py-3 px-5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Échéance</th>
                                        <th className="py-3 px-5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 text-right">Débit</th>
                                        <th className="py-3 px-5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 text-right">Crédit</th>
                                        <th className="py-3 px-5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {ecritures.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="py-12 text-center">
                                                <div className="flex flex-col items-center justify-center">
                                                    <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                                                        <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Aucune écriture</p>
                                                    <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-1">Commencez par ajouter une nouvelle pièce comptable.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : ecritures.map((item, idx) => (
                                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="py-3 px-5 text-xs font-bold text-slate-700 dark:text-slate-300">{item.jour}</td>
                                            <td className="py-3 px-5 text-xs font-bold text-slate-700 dark:text-slate-300">{item.numero_piece}</td>
                                            <td className="py-3 px-5 text-xs font-semibold text-slate-600 dark:text-slate-400">{item.numero_facture || '—'}</td>
                                            <td className="py-3 px-5 text-xs font-black text-indigo-600 dark:text-indigo-400" title={item.plan_comptable?.libelle}>
                                                {item.plan_comptable?.numero}
                                            </td>
                                            <td className="py-3 px-5 text-xs font-black text-emerald-600 dark:text-emerald-400" title={item.compteTier?.libelle}>
                                                {item.compteTier?.numero || '—'}
                                            </td>
                                            <td className="py-3 px-5 text-xs font-bold text-slate-800 dark:text-slate-200">{item.libelle}</td>
                                            <td className="py-3 px-5 text-xs font-medium text-slate-600 dark:text-slate-400">{item.date_echeance ? new Date(item.date_echeance).toLocaleDateString('fr-FR') : '—'}</td>
                                            <td className="py-3 px-5 text-xs text-right font-black text-slate-800 dark:text-slate-200">{Number(item.debit) > 0 ? Number(item.debit).toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : ''}</td>
                                            <td className="py-3 px-5 text-xs text-right font-black text-slate-800 dark:text-slate-200">{Number(item.credit) > 0 ? Number(item.credit).toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : ''}</td>
                                            <td className="py-3 px-5 text-center">
                                                <button onClick={() => handleDelete(item.id)} className="text-rose-500 hover:text-rose-700 p-1.5 rounded-full hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors">
                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Totals Footer */}
                        <div className="bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center">
                            <div className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Totaux Période :</div>
                            <div className="flex items-center gap-10">
                                <div className="text-right flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Débit</span>
                                    <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{totalDebit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</span>
                                </div>
                                <div className="text-right flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Crédit</span>
                                    <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{totalCredit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</span>
                                </div>
                            </div>
                        </div>

                        {/* Balanced Status */}
                        <div className={`px-6 py-3 flex justify-between items-center text-xs font-bold ${isBalanced ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                            <div>{ecritures.length} ligne(s) saisie(s)</div>
                            <div className="flex items-center space-x-2">
                                {isBalanced ? (
                                    <>
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                                        <span>Période équilibrée : 0,00 MAD</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                        <span>Période non équilibrée ! Solde : {Math.abs(solde).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD {solde > 0 ? '(Débiteur)' : '(Créditeur)'}</span>
                                    </>
                                )}
                            </div>
                        </div>

                    </div>
                )}
            </div>

            {/* MODAL AJOUT PIECE */}
            <Modal show={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="6xl">
                <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900">
                        <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight flex items-center">
                            <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            Ajouter une Pièce Comptable
                        </h3>
                        <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    <div className="p-6">
                        {/* 1. Header of the Piece */}
                        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-6 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div>
                                <label className="block text-[10px] font-black text-slate-455 uppercase tracking-widest mb-1.5">Jour <span className="text-rose-500">*</span></label>
                                <input type="number" min="1" max="31" value={pieceForm.jour} onChange={e => setPieceForm({...pieceForm, jour: e.target.value})}
                                    className="w-full rounded-2xl border border-slate-200/85 dark:border-slate-700/85 bg-white dark:bg-slate-900 text-xs font-bold text-slate-850 dark:text-slate-200 py-3 px-4 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-455 uppercase tracking-widest mb-1.5">N° Pièce <span className="text-rose-500">*</span></label>
                                <input type="text" value={pieceForm.numero_piece} onChange={e => setPieceForm({...pieceForm, numero_piece: e.target.value})}
                                    className="w-full rounded-2xl border border-slate-200/85 dark:border-slate-700/85 bg-white dark:bg-slate-900 text-xs font-bold text-slate-850 dark:text-slate-200 py-3 px-4 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-455 uppercase tracking-widest mb-1.5">N° Facture</label>
                                <input type="text" value={pieceForm.numero_facture} onChange={e => setPieceForm({...pieceForm, numero_facture: e.target.value})}
                                    className="w-full rounded-2xl border border-slate-200/85 dark:border-slate-700/85 bg-white dark:bg-slate-900 text-xs font-bold text-slate-850 dark:text-slate-200 py-3 px-4 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                            </div>
                        </div>

                        {/* 2. Line Insertion block */}
                        <div className="mb-6 flex flex-wrap gap-3 items-end p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5">Compte général</label>
                                <select value={tempLine.plan_comptable_id} onChange={e => setTempLine({...tempLine, plan_comptable_id: e.target.value})}
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold py-2.5 px-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                                    <option value=""></option>
                                    {comptes_generaux.map(c => <option key={c.id} value={c.id}>{c.numero} - {c.libelle}</option>)}
                                </select>
                            </div>
                            <div className="flex-1 min-w-[150px]">
                                <label className="block text-[10px] font-black text-slate-455 uppercase tracking-widest mb-1.5">Compte tiers</label>
                                <select value={tempLine.compte_tier_id} onChange={e => handleCompteTiersChange(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold py-2.5 px-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                                    <option value=""></option>
                                    {comptes_tiers.map(t => <option key={t.id} value={t.id}>{t.numero} - {t.libelle}</option>)}
                                </select>
                            </div>
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-[10px] font-black text-slate-455 uppercase tracking-widest mb-1.5">Libellé</label>
                                <input type="text" value={tempLine.libelle} onChange={e => setTempLine({...tempLine, libelle: e.target.value})}
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold py-2.5 px-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                            </div>
                            <div className="w-32">
                                <label className="block text-[10px] font-black text-slate-455 uppercase tracking-widest mb-1.5">Échéance</label>
                                <input type="date" value={tempLine.date_echeance} onChange={e => setTempLine({...tempLine, date_echeance: e.target.value})}
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] font-bold py-2.5 px-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                            </div>
                            <div className="w-28">
                                <label className="block text-[10px] font-black text-slate-455 uppercase tracking-widest mb-1.5 text-right">Débit</label>
                                <input type="number" step="0.01" min="0" value={tempLine.debit} onChange={e => setTempLine({...tempLine, debit: e.target.value, credit: e.target.value ? '0' : tempLine.credit})}
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-black text-right py-2.5 px-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                            </div>
                            <div className="w-28">
                                <label className="block text-[10px] font-black text-slate-455 uppercase tracking-widest mb-1.5 text-right">Crédit</label>
                                <input type="number" step="0.01" min="0" value={tempLine.credit} onChange={e => setTempLine({...tempLine, credit: e.target.value, debit: e.target.value ? '0' : tempLine.debit})}
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-black text-right py-2.5 px-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <button type="button" onClick={addTempLine} className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl shadow-sm transition-colors">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                                </button>
                            </div>
                        </div>

                        {/* 3. Lines Table */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden mb-6">
                            <table className="w-full text-left whitespace-nowrap">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                        <th className="py-2.5 px-4 text-[9px] font-black uppercase tracking-widest text-slate-500">Compte</th>
                                        <th className="py-2.5 px-4 text-[9px] font-black uppercase tracking-widest text-slate-500">Tiers</th>
                                        <th className="py-2.5 px-4 text-[9px] font-black uppercase tracking-widest text-slate-500 w-full">Libellé</th>
                                        <th className="py-2.5 px-4 text-[9px] font-black uppercase tracking-widest text-slate-500 text-right">Débit</th>
                                        <th className="py-2.5 px-4 text-[9px] font-black uppercase tracking-widest text-slate-500 text-right">Crédit</th>
                                        <th className="py-2.5 px-4"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pieceForm.lignes.map(l => {
                                        const compte = comptes_generaux.find(c => String(c.id) === String(l.plan_comptable_id));
                                        const tier = comptes_tiers.find(t => String(t.id) === String(l.compte_tier_id));
                                        return (
                                            <tr key={l.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                <td className="py-2.5 px-4 text-xs font-bold text-indigo-600 dark:text-indigo-400">{compte?.numero}</td>
                                                <td className="py-2.5 px-4 text-xs font-bold text-emerald-600 dark:text-emerald-400">{tier?.numero || '-'}</td>
                                                <td className="py-2.5 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300">{l.libelle}</td>
                                                <td className="py-2.5 px-4 text-xs font-black text-right text-slate-800 dark:text-slate-200">{Number(l.debit) > 0 ? Number(l.debit).toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : ''}</td>
                                                <td className="py-2.5 px-4 text-xs font-black text-right text-slate-800 dark:text-slate-200">{Number(l.credit) > 0 ? Number(l.credit).toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : ''}</td>
                                                <td className="py-2.5 px-4 text-right">
                                                    <button onClick={() => removeLine(l.id)} className="text-rose-500 hover:text-rose-700 p-1">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                            {pieceForm.lignes.length === 0 && (
                                <div className="py-8 text-center text-xs text-slate-400 font-medium">Aucune ligne n'a été ajoutée à cette pièce.</div>
                            )}
                        </div>

                        {/* Balance check */}
                        <div className={`p-4 rounded-xl flex items-center justify-between border ${isPieceBalanced ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                            <div className="flex items-center gap-3">
                                {isPieceBalanced ? (
                                    <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                ) : (
                                    <div className="h-8 w-8 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    </div>
                                )}
                                <div>
                                    <div className={`text-[10px] font-black uppercase tracking-widest ${isPieceBalanced ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                                        État de la Pièce
                                    </div>
                                    <div className={`text-sm font-bold ${isPieceBalanced ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                        {isPieceBalanced ? 'Pièce équilibrée' : `Écart : ${Math.abs(totalPieceDebit - totalPieceCredit).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD`}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-8 text-right">
                                <div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Débit</div>
                                    <div className="text-lg font-black text-slate-800 dark:text-slate-200">{totalPieceDebit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Crédit</div>
                                    <div className="text-lg font-black text-slate-800 dark:text-slate-200">{totalPieceCredit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</div>
                                </div>
                            </div>
                        </div>

                    </div>

                    <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors">
                            Annuler
                        </button>
                        <button type="button" onClick={handleSavePiece} disabled={!isPieceBalanced || pieceFormInertia.processing} 
                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-sm transition-colors flex items-center">
                            {pieceFormInertia.processing && <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                            Enregistrer la Pièce
                        </button>
                    </div>
                </div>
            </Modal>

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
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
