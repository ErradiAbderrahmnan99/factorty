import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import InputError from '@/Components/InputError';

interface Country {
    id: number;
    label: string;
}

interface Region {
    id: number;
    country_id: number;
    label: string;
}

interface City {
    id: number;
    region_id: number;
    label: string;
}

interface Devise {
    id: number;
    code: string;
    label: string;
    symbol: string | null;
}

interface TauxTva {
    id: number;
    code: string;
    libelle: string;
    taux: number;
    actif: boolean;
}

interface Entity {
    id: number;
    code: string | null;
    label: string;
    adress: string | null;
    country_id: number | null;
    region_id: number | null;
    city_id: number | null;
    devise_id: number | null;
    code_postal: string | null;
    tele: string | null;
    email: string | null;
    rc: string | null;
    patente: string | null;
    if: string | null;
    ice: string | null;
    cnss: string | null;
    forme_juridique: string | null;
    default_tva: number;
    default_tva_id: number | null;
    number_after_comma: number;
    country?: Country;
    region?: Region;
    city?: City;
    devise?: Devise;
}

export default function Index({
    entities,
    countries,
    regions,
    cities,
    devises,
    tauxTvas,
    legalForms
}: {
    entities: Entity[];
    countries: Country[];
    regions: Region[];
    cities: City[];
    devises: Devise[];
    tauxTvas: TauxTva[];
    legalForms: string[];
}) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Entity | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Entity | null>(null);

    const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm({
        code: '',
        label: '',
        adress: '',
        country_id: '',
        region_id: '',
        city_id: '',
        devise_id: '',
        code_postal: '',
        tele: '',
        email: '',
        rc: '',
        patente: '',
        if: '',
        ice: '',
        cnss: '',
        forme_juridique: '',
        default_tva_id: '',
        number_after_comma: 2
    });

    const openCreate = () => {
        reset();
        clearErrors();
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const openEdit = (item: Entity) => {
        setData({
            code: item.code || '',
            label: item.label,
            adress: item.adress || '',
            country_id: item.country_id ? String(item.country_id) : '',
            region_id: item.region_id ? String(item.region_id) : '',
            city_id: item.city_id ? String(item.city_id) : '',
            devise_id: item.devise_id ? String(item.devise_id) : '',
            code_postal: item.code_postal || '',
            tele: item.tele || '',
            email: item.email || '',
            rc: item.rc || '',
            patente: item.patente || '',
            if: item.if || '',
            ice: item.ice || '',
            cnss: item.cnss || '',
            forme_juridique: item.forme_juridique || '',
            default_tva_id: item.default_tva_id ? String(item.default_tva_id) : '',
            number_after_comma: Number(item.number_after_comma)
        });
        clearErrors();
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingItem) {
            patch(route('entities.update', editingItem.id), {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                }
            });
        } else {
            post(route('entities.store'), {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                }
            });
        }
    };

    // Filter regions based on selected country
    const filteredRegions = data.country_id
        ? regions.filter(r => String(r.country_id) === data.country_id)
        : [];

    // Filter cities based on selected region
    const filteredCities = data.region_id
        ? cities.filter(c => String(c.region_id) === data.region_id)
        : [];

    // Handle country change to reset dependent locations
    const handleCountryChange = (cId: string) => {
        setData(d => ({
            ...d,
            country_id: cId,
            region_id: '',
            city_id: ''
        }));
    };

    // Handle region change to reset dependent locations
    const handleRegionChange = (rId: string) => {
        setData(d => ({
            ...d,
            region_id: rId,
            city_id: ''
        }));
    };

    const entity = entities[0] || null;

    return (
        <AuthenticatedLayout header={
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 max-w-5xl mx-auto">
                <div>
                    <div className="flex items-center space-x-2 text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        <span>DDB</span><span>/</span><span className="text-indigo-650 dark:text-indigo-400">Entité</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1.5">
                        Configuration de l'Entité
                    </h2>
                </div>
                {!entity && (
                    <button onClick={openCreate} className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-widest rounded-2xl h-[42px] px-6 transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.97]">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                        <span>Créer l'Entité</span>
                    </button>
                )}
            </div>
        }>
            <Head title="Configuration de l'Entité" />

            <div className="max-w-5xl mx-auto">
                {entity ? (
                    <div className="space-y-6">
                        {/* Detail Card */}
                        <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl p-6 backdrop-blur-xl">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 dark:border-slate-800/60 pb-5 mb-6">
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <h3 className="text-lg font-black text-slate-850 dark:text-white">{entity.label}</h3>
                                        {entity.code && (
                                            <span className="font-mono text-[9px] font-extrabold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                                {entity.code}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">Forme juridique: {entity.forme_juridique || '—'}</p>
                                </div>
                                <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                                    <button onClick={() => openEdit(entity)} className="inline-flex items-center space-x-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-650 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/30 dark:text-indigo-400 font-bold text-xs uppercase tracking-widest rounded-2xl h-[38px] px-5 transition-all">
                                        <svg className="h-4 w-4 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                        <span>Modifier</span>
                                    </button>
                                    <button onClick={() => setDeleteTarget(entity)} className="inline-flex items-center space-x-2 bg-rose-50 hover:bg-rose-100 text-rose-650 dark:bg-rose-900/20 dark:hover:bg-rose-900/30 dark:text-rose-400 font-bold text-xs uppercase tracking-widest rounded-2xl h-[38px] px-5 transition-all">
                                        <svg className="h-4 w-4 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        <span>Supprimer</span>
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Group 1: General & Contact Info */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Coordonnées</h4>
                                    <div className="bg-slate-50 dark:bg-slate-950/20 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/40 space-y-3">
                                        <div className="flex justify-between text-xs py-1">
                                            <span className="text-slate-400">Email:</span>
                                            <span className="font-semibold text-slate-700 dark:text-slate-300">{entity.email || '—'}</span>
                                        </div>
                                        <div className="flex justify-between text-xs py-1">
                                            <span className="text-slate-400">Téléphone:</span>
                                            <span className="font-semibold text-slate-700 dark:text-slate-300">{entity.tele || '—'}</span>
                                        </div>
                                        <div className="flex justify-between text-xs py-1">
                                            <span className="text-slate-400">Adresse:</span>
                                            <span className="font-semibold text-slate-700 dark:text-slate-300 text-right max-w-xs">{entity.adress || '—'}</span>
                                        </div>
                                        <div className="flex justify-between text-xs py-1">
                                            <span className="text-slate-400">Localisation:</span>
                                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                {entity.city?.label ? `${entity.city.label}, ` : ''}
                                                {entity.region?.label ? `${entity.region.label}, ` : ''}
                                                {entity.country?.label || '—'} 
                                                {entity.code_postal ? ` (${entity.code_postal})` : ''}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Group 2: Fiscal & Identifiers */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Identifiants Légaux</h4>
                                    <div className="bg-slate-50 dark:bg-slate-950/20 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/40 space-y-3">
                                        <div className="flex justify-between text-xs py-1">
                                            <span className="text-slate-400">ICE:</span>
                                            <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">{entity.ice || '—'}</span>
                                        </div>
                                        <div className="flex justify-between text-xs py-1">
                                            <span className="text-slate-400">IF (Identifiant Fiscal):</span>
                                            <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">{entity.if || '—'}</span>
                                        </div>
                                        <div className="flex justify-between text-xs py-1">
                                            <span className="text-slate-400">RC (Registre de Commerce):</span>
                                            <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">{entity.rc || '—'}</span>
                                        </div>
                                        <div className="flex justify-between text-xs py-1">
                                            <span className="text-slate-400">Patente:</span>
                                            <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">{entity.patente || '—'}</span>
                                        </div>
                                        <div className="flex justify-between text-xs py-1">
                                            <span className="text-slate-400">CNSS:</span>
                                            <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">{entity.cnss || '—'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Group 3: Default Configuration */}
                                <div className="space-y-4 md:col-span-2">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Paramètres par défaut</h4>
                                    <div className="bg-slate-50 dark:bg-slate-950/20 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/40 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-center">
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Devise par défaut</div>
                                            <div className="text-sm font-black text-indigo-650 dark:text-indigo-400 mt-1.5">
                                                {entity.devise ? `${entity.devise.label} (${entity.devise.code})` : '—'}
                                            </div>
                                        </div>
                                        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-center">
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">TVA par défaut</div>
                                            <div className="text-lg font-black text-indigo-650 dark:text-indigo-400 mt-1">{entity.default_tva}%</div>
                                        </div>
                                        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-center">
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Décimales après la virgule</div>
                                            <div className="text-lg font-black text-indigo-650 dark:text-indigo-400 mt-1">{entity.number_after_comma}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl p-16 text-center backdrop-blur-xl">
                        <div className="h-16 w-16 bg-indigo-50 dark:bg-indigo-950/30 rounded-3xl flex items-center justify-center mx-auto mb-5 text-indigo-600 dark:text-indigo-400 shadow-inner">
                            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 mb-2">Aucune entité configurée</h3>
                        <p className="text-xs text-slate-455 max-w-sm mx-auto mb-6">Pour commencer à configurer vos documents commerciaux et financiers, vous devez créer l'identité unique de votre société.</p>
                    </div>
                )}
            </div>

            {/* Create / Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-md p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl p-6 my-8 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3 mb-5">
                            <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-855 dark:text-white">
                                {editingItem ? 'Modifier l\'Entité' : 'Nouvelle Entité'}
                            </h3>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={submit} className="space-y-4">
                            {/* General */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Raison Sociale <span className="text-rose-500">*</span></label>
                                    <input className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all font-semibold"
                                        value={data.label} onChange={e => setData('label', e.target.value)} placeholder="ex: Ma Société SARL" required />
                                    <InputError message={errors.label} className="mt-1" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Code</label>
                                    <input className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all font-semibold font-mono"
                                        value={data.code} onChange={e => setData('code', e.target.value)} placeholder="ex: COMP_A" />
                                    <InputError message={errors.code} className="mt-1" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Forme Juridique</label>
                                    <select className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all font-semibold text-slate-805 dark:text-slate-200"
                                        value={data.forme_juridique} onChange={e => setData('forme_juridique', e.target.value)}>
                                        <option value="">Choisir...</option>
                                        {legalForms.map(f => <option key={f} value={f}>{f}</option>)}
                                    </select>
                                    <InputError message={errors.forme_juridique} className="mt-1" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Téléphone</label>
                                    <input className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all font-semibold font-mono"
                                        value={data.tele} onChange={e => setData('tele', e.target.value)} placeholder="ex: 0522XXXXXX" />
                                    <InputError message={errors.tele} className="mt-1" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Email</label>
                                    <input type="email" className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all font-semibold"
                                        value={data.email} onChange={e => setData('email', e.target.value)} placeholder="ex: contact@entreprise.com" />
                                    <InputError message={errors.email} className="mt-1" />
                                </div>
                            </div>

                            {/* Location */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-950/20 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Pays</label>
                                    <select className="block w-full rounded-xl border border-slate-200/85 dark:border-slate-800/85 bg-white dark:bg-slate-900 text-xs py-2.5 px-3 focus:outline-none focus:border-indigo-500 transition-all font-semibold text-slate-850 dark:text-slate-200"
                                        value={data.country_id} onChange={e => handleCountryChange(e.target.value)}>
                                        <option value="">Choisir...</option>
                                        {countries.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                    </select>
                                    <InputError message={errors.country_id} className="mt-1" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Région</label>
                                    <select className="block w-full rounded-xl border border-slate-200/85 dark:border-slate-800/85 bg-white dark:bg-slate-900 text-xs py-2.5 px-3 focus:outline-none focus:border-indigo-500 transition-all font-semibold text-slate-850 dark:text-slate-200"
                                        value={data.region_id} onChange={e => handleRegionChange(e.target.value)} disabled={!data.country_id}>
                                        <option value="">Choisir...</option>
                                        {filteredRegions.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                                    </select>
                                    <InputError message={errors.region_id} className="mt-1" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Ville</label>
                                    <select className="block w-full rounded-xl border border-slate-200/85 dark:border-slate-800/85 bg-white dark:bg-slate-900 text-xs py-2.5 px-3 focus:outline-none focus:border-indigo-500 transition-all font-semibold text-slate-850 dark:text-slate-200"
                                        value={data.city_id} onChange={e => setData('city_id', e.target.value)} disabled={!data.region_id}>
                                        <option value="">Choisir...</option>
                                        {filteredCities.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                    </select>
                                    <InputError message={errors.city_id} className="mt-1" />
                                </div>
                            </div>

                            {/* Default parameters */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-indigo-500/5 dark:bg-indigo-950/20 p-4 rounded-2xl border border-indigo-500/10">
                                <div>
                                    <label className="block text-xs font-extrabold text-indigo-700 dark:text-indigo-400 mb-1.5">Devise par défaut</label>
                                    <select className="block w-full rounded-xl border border-slate-200/85 dark:border-slate-800/85 bg-white dark:bg-slate-900 text-xs py-2.5 px-3 focus:outline-none focus:border-indigo-500 transition-all font-semibold text-slate-850 dark:text-slate-200"
                                        value={data.devise_id} onChange={e => setData('devise_id', e.target.value)} required>
                                        <option value="">Choisir...</option>
                                        {devises.map(dev => <option key={dev.id} value={dev.id}>{dev.label} ({dev.code})</option>)}
                                    </select>
                                    <InputError message={errors.devise_id} className="mt-1" />
                                </div>
                                <div>
                                    <label className="block text-xs font-extrabold text-indigo-700 dark:text-indigo-400 mb-1.5">TVA par défaut <span className="text-rose-500">*</span></label>
                                    <select className="block w-full rounded-xl border border-slate-200/85 dark:border-slate-800/85 bg-white dark:bg-slate-900 text-xs py-2.5 px-3 focus:outline-none focus:border-indigo-500 transition-all font-semibold text-slate-850 dark:text-slate-200"
                                        value={data.default_tva_id} onChange={e => setData('default_tva_id', e.target.value)} required>
                                        <option value="">Choisir un taux TVA...</option>
                                        {tauxTvas.map(t => (
                                            <option key={t.id} value={t.id}>{t.taux}% — {t.libelle}</option>
                                        ))}
                                    </select>
                                    <InputError message={errors.default_tva_id} className="mt-1" />
                                </div>
                                <div>
                                    <label className="block text-xs font-extrabold text-indigo-700 dark:text-indigo-400 mb-1.5">Décimales de prix <span className="text-rose-500">*</span></label>
                                    <input type="number" min="0" max="6" className="block w-full rounded-xl border border-slate-200/85 dark:border-slate-800/85 bg-white dark:bg-slate-900 text-xs py-2.5 px-3 focus:outline-none focus:border-indigo-500 transition-all font-semibold"
                                        value={data.number_after_comma} onChange={e => setData('number_after_comma', Number(e.target.value))} placeholder="ex: 2" required />
                                    <InputError message={errors.number_after_comma} className="mt-1" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Adresse</label>
                                    <textarea rows={2} className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all font-semibold"
                                        value={data.adress} onChange={e => setData('adress', e.target.value)} placeholder="Adresse du siège social..." />
                                    <InputError message={errors.adress} className="mt-1" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Code Postal</label>
                                    <input className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all font-semibold font-mono"
                                        value={data.code_postal} onChange={e => setData('code_postal', e.target.value)} placeholder="ex: 20000" />
                                    <InputError message={errors.code_postal} className="mt-1" />
                                </div>
                            </div>

                            {/* Identifiers */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">ICE</label>
                                    <input className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all font-semibold font-mono"
                                        value={data.ice} onChange={e => setData('ice', e.target.value)} placeholder="ex: 0015XXXXXX" />
                                    <InputError message={errors.ice} className="mt-1" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">IF (Ident. Fiscal)</label>
                                    <input className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all font-semibold font-mono"
                                        value={data.if} onChange={e => setData('if', e.target.value)} placeholder="ex: 402XXXX" />
                                    <InputError message={errors.if} className="mt-1" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">RC (Reg. Commerce)</label>
                                    <input className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all font-semibold font-mono"
                                        value={data.rc} onChange={e => setData('rc', e.target.value)} placeholder="ex: 123456" />
                                    <InputError message={errors.rc} className="mt-1" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Patente</label>
                                    <input className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all font-semibold font-mono"
                                        value={data.patente} onChange={e => setData('patente', e.target.value)} placeholder="ex: 351XXXX" />
                                    <InputError message={errors.patente} className="mt-1" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">CNSS</label>
                                    <input className="block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-3 px-4 focus:outline-none focus:border-indigo-500 transition-all font-semibold font-mono"
                                        value={data.cnss} onChange={e => setData('cnss', e.target.value)} placeholder="ex: 9876543" />
                                    <InputError message={errors.cnss} className="mt-1" />
                                </div>
                            </div>

                            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-330 rounded-2xl hover:bg-slate-200 transition-all font-semibold">Annuler</button>
                                <button type="submit" disabled={processing} className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl transition-all active:scale-[0.97] disabled:opacity-60">{processing ? 'Enregistrement...' : 'Enregistrer'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-md p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-3xl shadow-2xl p-6">
                        <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-855 dark:text-white mb-2">Supprimer l'entité ?</h3>
                        <p className="text-xs text-slate-500 mb-5">Êtes-vous sûr de vouloir supprimer l'entité <strong>"{deleteTarget.label}"</strong> ? Cette action supprimera également sa configuration.</p>
                        <div className="flex items-center justify-end space-x-3">
                            <button onClick={() => setDeleteTarget(null)} className="px-5 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-350 rounded-2xl hover:bg-slate-200 transition-all font-semibold">Annuler</button>
                            <button onClick={() => router.delete(route('entities.destroy', deleteTarget.id), { onSuccess: () => setDeleteTarget(null) })} className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-2xl transition-all shadow-md shadow-rose-500/20 active:scale-[0.97]">Supprimer</button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
