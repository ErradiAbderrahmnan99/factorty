import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import DecimalInput from '@/Components/DecimalInput';
import { useState } from 'react';
import { useEntitySettings } from '@/Utils/entitySettings';

interface Tier {
    id: number;
    label: string;
    type: string;
    type_approbateur_id?: number | null;
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
    stock_unit?: Unit;
    unit_category_id: number | null;
}

interface Devise {
    id: number;
    code: string;
    label: string;
    symbol: string | null;
}

interface LookupItem {
    id: number;
    label: string;
    code?: string;
}

interface LineItem {
    product_id: string;
    sale_unit_id: string;
    tva: number;
    qty: number;
    pu_ht: number;
    pu_ttc: number;
    remise: number;
    rm: number;
    total_ht: number;
    total_ttc: number;
}

export default function Create({
    tiers,
    products,
    devises,
    units,
    commercials,
    modesReglement = [],
    conditionsReglement = [],
    origines = [],
    comptesBancaires = [],
    typesApprobateur = [],
    approbateurs = [],
}: {
    tiers: Tier[];
    products: Product[];
    devises: Devise[];
    units: Unit[];
    commercials: { id: number; first_name: string; last_name: string; type: string; }[];
    modesReglement?: LookupItem[];
    conditionsReglement?: LookupItem[];
    origines?: LookupItem[];
    comptesBancaires?: LookupItem[];
    typesApprobateur?: LookupItem[];
    approbateurs?: (Tier & { type_approbateur?: { label: string } })[];
}) {
    const today = new Date().toISOString().split('T')[0];
    const [selectedTypeApprobateur, setSelectedTypeApprobateur] = useState('');
    const filteredApprobateurs = selectedTypeApprobateur
        ? approbateurs.filter(item => item.type_approbateur_id?.toString() === selectedTypeApprobateur)
        : approbateurs;

    const { decimals, defaultTva, defaultDeviseId, formatMoney, roundMoney, stepMoney } = useEntitySettings();

    const { data, setData, post, processing, errors } = useForm({
        tier_id: '',
        commercial: '',
        date_contrat: today,
        date_echeance: '',
        devise_id: defaultDeviseId || (devises.length > 0 ? devises[0].id.toString() : ''),
        mode_reglement_id: '',
        condition_reglement_id: '',
        origine_id: '',
        compte_bancaire_id: '',
        approbateur_id: '',
        delai_livraison: '',
        date_livraison: '',
        note_public: '',
        note_private: '',
        lines: [] as LineItem[],
    });

    const addLine = () => {
        const newLine: LineItem = {
            product_id: '',
            sale_unit_id: '',
            tva: defaultTva,
            qty: 1,
            pu_ht: 0,
            pu_ttc: 0,
            remise: 0,
            rm: 0,
            total_ht: 0,
            total_ttc: 0,
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
                line.pu_ht = roundMoney(Number(prod.sale_price) || 0);
                line.sale_unit_id = prod.sale_unit_id ? prod.sale_unit_id.toString() : '';
                line.tva = defaultTva;
                line.pu_ttc = roundMoney(line.pu_ht * (1 + line.tva / 100));
                line.rm = roundMoney((line.qty * line.pu_ht) * (line.remise / 100));
            }
        } else if (field === 'remise') {
            line.remise = Number(value) || 0;
            line.rm = roundMoney((line.qty * line.pu_ht) * (line.remise / 100));
        } else if (field === 'rm') {
            line.rm = roundMoney(Number(value) || 0);
            const lineHtTotal = line.qty * line.pu_ht;
            line.remise = lineHtTotal > 0 ? roundMoney((line.rm / lineHtTotal) * 100) : 0;
        } else if (field === 'qty' || field === 'tva') {
            line[field] = Number(value) || 0;
            line.pu_ttc = roundMoney(line.pu_ht * (1 + line.tva / 100));
            line.rm = roundMoney((line.qty * line.pu_ht) * (line.remise / 100));
        } else if (field === 'pu_ht') {
            line.pu_ht = roundMoney(Number(value) || 0);
            line.pu_ttc = roundMoney(line.pu_ht * (1 + line.tva / 100));
            line.rm = roundMoney((line.qty * line.pu_ht) * (line.remise / 100));
        } else if (field === 'pu_ttc') {
            line.pu_ttc = roundMoney(Number(value) || 0);
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

    const totalHT = data.lines.reduce((sum, item) => sum + roundMoney(item.total_ht), 0);
    const totalTTC = data.lines.reduce((sum, item) => sum + roundMoney(item.total_ttc), 0);
    const totalTVA = Math.max(0, totalTTC - totalHT);
    const totalRemise = data.lines.reduce((sum, item) => sum + roundMoney(item.rm), 0);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('contrats-vente.store'));
    };

    return (
        <AuthenticatedLayout header={
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 max-w-7xl mx-auto">
                <div>
                    <div className="flex items-center space-x-2 text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        <span>Ventes</span><span>/</span>
                        <span>Contrats</span><span>/</span>
                        <span className="text-indigo-650 dark:text-indigo-400">Créer</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1.5 animate-pulse">
                        Nouveau Contrat de Vente
                    </h2>
                </div>
                <Link href={route('contrats-vente.index')} className="px-5 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-750 transition-all shadow-sm">
                    Retour à la liste
                </Link>
            </div>
        }>
            <Head title="Créer un Contrat de Vente" />
            <form onSubmit={submit} className="max-w-7xl mx-auto space-y-6">
                
                {/* General Information */}
                <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl p-6 backdrop-blur-xl space-y-6">
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-855 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">1. Informations Générales</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Client <span className="text-rose-500">*</span></label>
                            <select className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-200 font-semibold"
                                value={data.tier_id} onChange={e => setData('tier_id', e.target.value)} required>
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
                                value={data.commercial} onChange={e => setData('commercial', e.target.value)}>
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
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Date du Contrat <span className="text-rose-500">*</span></label>
                            <input type="date" className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-200 font-mono"
                                value={data.date_contrat} onChange={e => setData('date_contrat', e.target.value)} required />
                            <InputError message={errors.date_contrat} className="mt-1" />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Devise <span className="text-rose-500">*</span></label>
                            <select className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-200"
                                value={data.devise_id} onChange={e => setData('devise_id', e.target.value)} required>
                                {devises.map(d => (
                                    <option key={d.id} value={d.id}>{d.label} ({d.symbol || d.code})</option>
                                ))}
                            </select>
                            <InputError message={errors.devise_id} className="mt-1" />
                        </div>
                    </div>
                </div>

                {/* Additional Reference Lookups */}
                <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl p-6 backdrop-blur-xl space-y-6">
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-855 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">2. Conditions, Origine & Approbateur</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Mode de règlement</label>
                            <select className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-200"
                                value={data.mode_reglement_id} onChange={e => setData('mode_reglement_id', e.target.value)}>
                                <option value="">Sélectionner...</option>
                                {modesReglement.map(item => (
                                    <option key={item.id} value={item.id}>{item.label}</option>
                                ))}
                            </select>
                            <InputError message={errors.mode_reglement_id} className="mt-1" />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Conditions de règlement</label>
                            <select className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-200"
                                value={data.condition_reglement_id} onChange={e => setData('condition_reglement_id', e.target.value)}>
                                <option value="">Sélectionner...</option>
                                {conditionsReglement.map(item => (
                                    <option key={item.id} value={item.id}>{item.label}</option>
                                ))}
                            </select>
                            <InputError message={errors.condition_reglement_id} className="mt-1" />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Compte bancaire</label>
                            <select className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-200"
                                value={data.compte_bancaire_id} onChange={e => setData('compte_bancaire_id', e.target.value)}>
                                <option value="">Sélectionner...</option>
                                {comptesBancaires.map(item => (
                                    <option key={item.id} value={item.id}>{item.label} {item.code ? `(${item.code})` : ''}</option>
                                ))}
                            </select>
                            <InputError message={errors.compte_bancaire_id} className="mt-1" />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Origine</label>
                            <select className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-200"
                                value={data.origine_id} onChange={e => setData('origine_id', e.target.value)}>
                                <option value="">Sélectionner...</option>
                                {origines.map(item => (
                                    <option key={item.id} value={item.id}>{item.label}</option>
                                ))}
                            </select>
                            <InputError message={errors.origine_id} className="mt-1" />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Délai de livraison (jours)</label>
                            <input type="number" placeholder="Ex: 5" className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-200"
                                value={data.delai_livraison} onChange={e => setData('delai_livraison', e.target.value)} />
                            <InputError message={errors.delai_livraison} className="mt-1" />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Date limite de livraison</label>
                            <input type="date" className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-200 font-mono"
                                value={data.date_livraison} onChange={e => setData('date_livraison', e.target.value)} />
                            <InputError message={errors.date_livraison} className="mt-1" />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Type d'Approbateur</label>
                            <select className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-955/40 text-xs py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-200 font-semibold"
                                value={selectedTypeApprobateur}
                                onChange={e => {
                                    setSelectedTypeApprobateur(e.target.value);
                                    setData('approbateur_id', '');
                                }}>
                                <option value="">Tous les types...</option>
                                {typesApprobateur.map(item => (
                                    <option key={item.id} value={item.id}>{item.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Approbateur</label>
                            <select className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-200 font-semibold"
                                value={data.approbateur_id} onChange={e => setData('approbateur_id', e.target.value)}>
                                <option value="">Sélectionner...</option>
                                {filteredApprobateurs.map(item => (
                                    <option key={item.id} value={item.id}>{item.label}</option>
                                ))}
                            </select>
                            <InputError message={errors.approbateur_id} className="mt-1" />
                        </div>
                    </div>
                </div>

                {/* Line Items Table */}
                <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl overflow-hidden p-6 backdrop-blur-xl space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-855 dark:text-white">3. Lignes du Contrat</h3>
                        <button type="button" onClick={addLine}
                            className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-2xl transition-all shadow-md shadow-indigo-500/10 active:scale-95">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                            <span>Ajouter un produit</span>
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[1100px]">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800/50 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                                    <th className="pb-3 w-[300px] min-w-[300px]">Produit <span className="text-rose-500">*</span></th>
                                    <th className="pb-3 px-2 w-[80px] min-w-[80px]">TVA %</th>
                                    <th className="pb-3 px-2 w-[110px] min-w-[110px]">Quantité</th>
                                    <th className="pb-3 px-2 w-[140px] min-w-[140px]">Unité</th>
                                    <th className="pb-3 px-2 w-[110px] min-w-[110px]">P.U. HT</th>
                                    <th className="pb-3 px-2 w-[110px] min-w-[110px]">P.U. TTC</th>
                                    <th className="pb-3 px-2 w-[85px] min-w-[85px]">Remise %</th>
                                    <th className="pb-3 px-2 w-[95px] min-w-[95px]">RM (Amt)</th>
                                    <th className="pb-3 text-right pr-2 w-[100px] min-w-[100px]">Total HT</th>
                                    <th className="pb-3 w-12 text-center"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/50">
                                {data.lines.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="py-12 text-center text-xs text-slate-400 font-medium">
                                            Aucun produit ajouté. Cliquez sur "Ajouter un produit" pour commencer.
                                        </td>
                                    </tr>
                                ) : data.lines.map((line, idx) => {
                                    const selectedProd = products.find(p => p.id.toString() === line.product_id);

                                    return (
                                        <tr key={idx} className="group hover:bg-slate-50/20 dark:hover:bg-slate-850/5 transition-all">
                                            <td className="py-3 pr-2">
                                                <select className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-2 px-3 focus:outline-none focus:border-indigo-500 transition-all font-semibold"
                                                    value={line.product_id} onChange={e => updateLineField(idx, 'product_id', e.target.value)} required>
                                                    <option value="">Choisir...</option>
                                                    {products.map(p => (
                                                        <option key={p.id} value={p.id}>{p.ref ? `[${p.ref}] ` : ''}{p.label} (P.U: {formatMoney(Number(p.sale_price))})</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="py-3 px-2">
                                                <input type="number" step="0.01" className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-2 px-3 focus:outline-none focus:border-indigo-500 font-semibold"
                                                    value={line.tva} onChange={e => updateLineField(idx, 'tva', e.target.value)} required />
                                            </td>
                                            <td className="py-3 px-2">
                                                <input type="number" step="0.0001" className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-2 px-3 focus:outline-none focus:border-indigo-500 font-semibold"
                                                    value={line.qty} onChange={e => updateLineField(idx, 'qty', e.target.value)} required />
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
                                                    value={line.sale_unit_id} onChange={e => updateLineField(idx, 'sale_unit_id', e.target.value)}>
                                                    <option value="">Standard</option>
                                                    {units
                                                        .filter(u => !selectedProd || u.unit_category_id === (selectedProd as any).unit_category_id)
                                                        .map(u => (
                                                            <option key={u.id} value={u.id}>{u.label} ({u.code})</option>
                                                        ))}
                                                </select>
                                            </td>
                                            <td className="py-3 px-2">
                                                <DecimalInput value={line.pu_ht} onChange={val => updateLineField(idx, 'pu_ht', val)} decimals={decimals} className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-2 px-3 focus:outline-none focus:border-indigo-500 font-semibold" required />
                                            </td>
                                            <td className="py-3 px-2">
                                                <DecimalInput value={line.pu_ttc} onChange={val => updateLineField(idx, 'pu_ttc', val)} decimals={decimals} className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-2 px-3 focus:outline-none focus:border-indigo-500 font-semibold" required />
                                            </td>
                                            <td className="py-3 px-2">
                                                <input type="number" step="0.01" className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-955/40 text-xs py-2 px-3 focus:outline-none focus:border-indigo-500 font-semibold"
                                                    value={line.remise} onChange={e => updateLineField(idx, 'remise', e.target.value)} />
                                            </td>
                                            <td className="py-3 px-2">
                                                <DecimalInput value={line.rm} onChange={val => updateLineField(idx, 'rm', val)} decimals={decimals} className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-955/40 text-xs py-2 px-3 focus:outline-none focus:border-indigo-500 font-semibold" />
                                            </td>
                                            <td className="py-3 text-right pr-2 font-mono text-xs font-black text-slate-800 dark:text-slate-100 select-none">
                                                {formatMoney(line.total_ht)}
                                            </td>
                                            <td className="py-3 text-center">
                                                <button type="button" onClick={() => removeLine(idx)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-all">
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

                {/* Notes Input */}
                <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl p-6 backdrop-blur-xl space-y-6">
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-855 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">4. Remarques & Notes</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Note Publique (affichée sur le contrat)</label>
                            <textarea rows={3} placeholder="Saisir une note publique..." className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-3 px-4 focus:outline-none focus:border-indigo-555 transition-all text-slate-800 dark:text-slate-200 font-semibold"
                                value={data.note_public} onChange={e => setData('note_public', e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Note Privée (réservée à l'usage interne)</label>
                            <textarea rows={3} placeholder="Saisir une note privée..." className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-3 px-4 focus:outline-none focus:border-indigo-555 transition-all text-slate-800 dark:text-slate-200 font-semibold"
                                value={data.note_private} onChange={e => setData('note_private', e.target.value)} />
                        </div>
                    </div>
                </div>

                {/* Summary & Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl p-6 backdrop-blur-xl h-full flex flex-col justify-between">
                            <div className="space-y-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Remarques / Instructions</span>
                                <p className="text-xs text-slate-455 dark:text-slate-400 leading-relaxed font-medium">
                                    Une fois ce contrat enregistré, son statut initial sera défini comme <span className="font-bold text-indigo-500">Brouillon</span>. Il s'agit d'un document contractuel qui n'affecte pas directement l'inventaire des produits ou la gestion de stock.
                                </p>
                            </div>
                            <div className="flex items-center space-x-3 pt-6 border-t border-slate-100 dark:border-slate-800 mt-6 font-semibold">
                                <Link href={route('contrats-vente.index')} className="px-5 py-2.5 text-xs font-bold text-slate-655 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-250 dark:hover:bg-slate-750 transition-all select-none">
                                    Annuler
                                </Link>
                                <button type="submit" disabled={processing || data.lines.length === 0}
                                    className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl active:scale-[0.97] transition-all disabled:opacity-50 select-none shadow-md shadow-indigo-500/10">
                                    Enregistrer le Contrat
                                </button>
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
                                    {formatMoney(totalTTC)} <span className="text-xs text-slate-455">{devises.find(d => d.id.toString() === data.devise_id)?.symbol || devises.find(d => d.id.toString() === data.devise_id)?.code || ''}</span>
                                </span>
                            </div>
                        </div>

                        <div className="text-[10px] text-slate-500 font-medium text-center select-none pt-2 border-t border-slate-850">
                            Calculé en temps réel • Arrondi à {decimals} décimales par ligne
                        </div>
                    </div>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
