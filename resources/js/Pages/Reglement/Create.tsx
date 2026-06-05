import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect } from 'react';

interface Tier {
    id: number;
    label: string;
    type: string;
}

interface ModeReglement {
    id: number;
    label: string;
}

interface StatutReglement {
    id: number;
    label: string;
    mode_reglement_id: number;
    is_banque: boolean;
}

interface CompteBancaire {
    id: number;
    label: string;
}

export default function Create({
    tiers,
    modes,
    comptes,
    statuts,
}: {
    tiers: Tier[];
    modes: ModeReglement[];
    comptes: CompteBancaire[];
    statuts: StatutReglement[];
}) {
    const { data, setData, post, processing, errors } = useForm({
        type: 'vente',
        tier_id: '',
        date_saisie: new Date().toISOString().split('T')[0],
        date_reglement: new Date().toISOString().split('T')[0],
        montant_ttc: '',
        mode_reglement_id: '',
        statut_reglement_id: '',
        compte_bancaire_id: '',
        numero_transaction: '',
        emetteur: '',
        banque_cheque: '',
        commentaire: '',
        sense: 'd',
    });

    // Auto-update sense and filter tiers when type changes
    useEffect(() => {
        if (data.type === 'vente') {
            setData((d) => ({ ...d, sense: 'd', tier_id: '' }));
        } else {
            setData((d) => ({ ...d, sense: 'c', tier_id: '' }));
        }
    }, [data.type]);

    const filteredTiers = tiers.filter(
        (t) => t.type === (data.type === 'vente' ? 'client' : 'fournisseur')
    );

    const filteredStatuts = statuts.filter(
        (s) => String(s.mode_reglement_id) === String(data.mode_reglement_id)
    );

    const selectedStatut = statuts.find(
        (s) => String(s.id) === String(data.statut_reglement_id)
    );
    const isBanqueRequired = selectedStatut?.is_banque === true;

    const handleModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newModeId = e.target.value;
        setData((d) => ({
            ...d,
            mode_reglement_id: newModeId,
            statut_reglement_id: '', // reset status when mode changes
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('reglements.store'));
    };

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center space-x-2 text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest max-w-7xl mx-auto">
                <Link href={route('reglements.index')} className="hover:text-slate-650 transition-colors">Règlements</Link>
                <span>/</span>
                <span className="text-indigo-650 dark:text-indigo-400">Nouveau Règlement</span>
            </div>
        }>
            <Head title="Créer un Règlement" />

            <form onSubmit={handleSubmit} className="max-w-7xl mx-auto space-y-6">
                {/* Actions Bar */}
                <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Nouveau Règlement</h2>
                        <p className="text-xs text-slate-450 mt-1 leading-relaxed">Saisir les informations financières pour l'opération de règlement.</p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                        <Link
                            href={route('reglements.index')}
                            className="px-5 py-2.5 text-xs font-bold text-slate-650 dark:text-slate-350 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-750 transition-all active:scale-95 text-center"
                        >
                            Annuler
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl transition-all shadow-md shadow-indigo-500/25 active:scale-95 disabled:opacity-50 text-center"
                        >
                            Enregistrer
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Core Fields */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-6">
                            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-500">Informations Générales</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-455 uppercase tracking-widest mb-1.5">Type de Règlement <span className="text-rose-500">*</span></label>
                                    <select
                                        value={data.type}
                                        onChange={(e) => setData('type', e.target.value)}
                                        required
                                        className="w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50/40 dark:bg-slate-950/40 text-xs font-semibold text-slate-800 dark:text-slate-200 py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all"
                                    >
                                        <option value="vente">Vente (Encaissement Client)</option>
                                        <option value="achat">Achat (Décaissement Fournisseur)</option>
                                    </select>
                                    {errors.type && <span className="text-[10px] text-rose-500 font-bold mt-1 block">{errors.type}</span>}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-455 uppercase tracking-widest mb-1.5">Tiers <span className="text-rose-500">*</span></label>
                                    <select
                                        value={data.tier_id}
                                        onChange={(e) => setData('tier_id', e.target.value)}
                                        required
                                        className="w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50/40 dark:bg-slate-950/40 text-xs font-semibold text-slate-800 dark:text-slate-200 py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all"
                                    >
                                        <option value="">Choisir un tiers...</option>
                                        {filteredTiers.map((t) => (
                                            <option key={t.id} value={t.id}>{t.label}</option>
                                        ))}
                                    </select>
                                    {errors.tier_id && <span className="text-[10px] text-rose-500 font-bold mt-1 block">{errors.tier_id}</span>}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-455 uppercase tracking-widest mb-1.5">Date Saisie <span className="text-rose-500">*</span></label>
                                    <input
                                        type="date"
                                        value={data.date_saisie}
                                        onChange={(e) => setData('date_saisie', e.target.value)}
                                        required
                                        className="w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50/40 dark:bg-slate-950/40 text-xs font-semibold text-slate-800 dark:text-slate-200 py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all"
                                    />
                                    {errors.date_saisie && <span className="text-[10px] text-rose-500 font-bold mt-1 block">{errors.date_saisie}</span>}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-455 uppercase tracking-widest mb-1.5">Date Règlement <span className="text-rose-500">*</span></label>
                                    <input
                                        type="date"
                                        value={data.date_reglement}
                                        onChange={(e) => setData('date_reglement', e.target.value)}
                                        required
                                        className="w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50/40 dark:bg-slate-950/40 text-xs font-semibold text-slate-800 dark:text-slate-200 py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all"
                                    />
                                    {errors.date_reglement && <span className="text-[10px] text-rose-500 font-bold mt-1 block">{errors.date_reglement}</span>}
                                </div>
                            </div>
                        </div>

                        {/* Transaction specific details */}
                        <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-6">
                            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-500">Détails chèque / virement (Optionnel)</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-455 uppercase tracking-widest mb-1.5">Numéro Chèque/Virement</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: CHQ-879872"
                                        value={data.numero_transaction}
                                        onChange={(e) => setData('numero_transaction', e.target.value)}
                                        className="w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50/40 dark:bg-slate-950/40 text-xs font-semibold text-slate-800 dark:text-slate-200 py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all"
                                    />
                                    {errors.numero_transaction && <span className="text-[10px] text-rose-500 font-bold mt-1 block">{errors.numero_transaction}</span>}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-455 uppercase tracking-widest mb-1.5">Émetteur</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Client SARL"
                                        value={data.emetteur}
                                        onChange={(e) => setData('emetteur', e.target.value)}
                                        className="w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50/40 dark:bg-slate-950/40 text-xs font-semibold text-slate-800 dark:text-slate-200 py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all"
                                    />
                                    {errors.emetteur && <span className="text-[10px] text-rose-500 font-bold mt-1 block">{errors.emetteur}</span>}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-455 uppercase tracking-widest mb-1.5">Banque du chèque</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Attijariwafa Bank"
                                        value={data.banque_cheque}
                                        onChange={(e) => setData('banque_cheque', e.target.value)}
                                        className="w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50/40 dark:bg-slate-950/40 text-xs font-semibold text-slate-800 dark:text-slate-200 py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all"
                                    />
                                    {errors.banque_cheque && <span className="text-[10px] text-rose-500 font-bold mt-1 block">{errors.banque_cheque}</span>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-455 uppercase tracking-widest mb-1.5">Commentaire</label>
                                <textarea
                                    rows={3}
                                    placeholder="Notes sur la transaction..."
                                    value={data.commentaire}
                                    onChange={(e) => setData('commentaire', e.target.value)}
                                    className="w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50/40 dark:bg-slate-950/40 text-xs font-semibold text-slate-800 dark:text-slate-200 py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all resize-none"
                                />
                                {errors.commentaire && <span className="text-[10px] text-rose-500 font-bold mt-1 block">{errors.commentaire}</span>}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Financial & Status Settings */}
                    <div className="space-y-6">
                        <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-6">
                            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-500">Montant & Trésorerie</h3>

                            <div>
                                <label className="block text-[10px] font-black text-slate-455 uppercase tracking-widest mb-1.5">Montant TTC <span className="text-rose-500">*</span></label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="any"
                                        min="0.0001"
                                        placeholder="0.00"
                                        value={data.montant_ttc}
                                        onChange={(e) => setData('montant_ttc', e.target.value)}
                                        required
                                        className="w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50/40 dark:bg-slate-950/40 text-sm font-black text-slate-850 dark:text-slate-200 py-3 pl-4 pr-12 focus:outline-none focus:border-indigo-500 transition-all"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-400">DH</span>
                                </div>
                                {errors.montant_ttc && <span className="text-[10px] text-rose-500 font-bold mt-1 block">{errors.montant_ttc}</span>}
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-455 uppercase tracking-widest mb-1.5">Sens comptable <span className="text-rose-500">*</span></label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setData('sense', 'd')}
                                        className={`py-3 rounded-2xl text-xs font-extrabold transition-all border ${
                                            data.sense === 'd'
                                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-sm'
                                                : 'bg-slate-50/40 border-slate-200/80 text-slate-450 hover:bg-slate-100/50'
                                        }`}
                                    >
                                        Débit (+)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setData('sense', 'c')}
                                        className={`py-3 rounded-2xl text-xs font-extrabold transition-all border ${
                                            data.sense === 'c'
                                                ? 'bg-rose-500/10 text-rose-600 border-rose-500/20 shadow-sm'
                                                : 'bg-slate-50/40 border-slate-200/80 text-slate-450 hover:bg-slate-100/50'
                                        }`}
                                    >
                                        Crédit (-)
                                    </button>
                                </div>
                                {errors.sense && <span className="text-[10px] text-rose-500 font-bold mt-1 block">{errors.sense}</span>}
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-455 uppercase tracking-widest mb-1.5">Mode de Règlement <span className="text-rose-500">*</span></label>
                                <select
                                    value={data.mode_reglement_id}
                                    onChange={handleModeChange}
                                    required
                                    className="w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50/40 dark:bg-slate-950/40 text-xs font-semibold text-slate-800 dark:text-slate-200 py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all"
                                >
                                    <option value="">Choisir un mode...</option>
                                    {modes.map((m) => (
                                        <option key={m.id} value={m.id}>{m.label}</option>
                                    ))}
                                </select>
                                {errors.mode_reglement_id && <span className="text-[10px] text-rose-500 font-bold mt-1 block">{errors.mode_reglement_id}</span>}
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-455 uppercase tracking-widest mb-1.5">Statut <span className="text-rose-500">*</span></label>
                                <select
                                    value={data.statut_reglement_id}
                                    onChange={(e) => setData('statut_reglement_id', e.target.value)}
                                    required
                                    disabled={!data.mode_reglement_id}
                                    className="w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50/40 dark:bg-slate-950/40 text-xs font-semibold text-slate-800 dark:text-slate-200 py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all disabled:opacity-55"
                                >
                                    <option value="">
                                        {data.mode_reglement_id ? 'Sélectionner un statut...' : 'Veuillez d\'abord choisir un mode'}
                                    </option>
                                    {filteredStatuts.map((st) => (
                                        <option key={st.id} value={st.id}>{st.label}</option>
                                    ))}
                                </select>
                                {errors.statut_reglement_id && <span className="text-[10px] text-rose-500 font-bold mt-1 block">{errors.statut_reglement_id}</span>}
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-455 uppercase tracking-widest mb-1.5">
                                    Banque à Créditer/Débiter {isBanqueRequired && <span className="text-rose-500">*</span>}
                                </label>
                                <select
                                    value={data.compte_bancaire_id}
                                    onChange={(e) => setData('compte_bancaire_id', e.target.value)}
                                    required={isBanqueRequired}
                                    className="w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50/40 dark:bg-slate-950/40 text-xs font-semibold text-slate-800 dark:text-slate-200 py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all"
                                >
                                    <option value="">Sélectionner un compte bancaire...</option>
                                    {comptes.map((c) => (
                                        <option key={c.id} value={c.id}>{c.label}</option>
                                    ))}
                                </select>
                                {errors.compte_bancaire_id && <span className="text-[10px] text-rose-500 font-bold mt-1 block">{errors.compte_bancaire_id}</span>}
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
