import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useState, useEffect, useRef } from 'react';
import InputError from '@/Components/InputError';

interface SelectItem { id: number; label: string; }
interface RegionItem { id: number; label: string; country_id: number; }
interface CityItem { id: number; label: string; region_id: number; }
interface ParentItem { id: number; label: string; ref: string | null; }

interface TierData {
    id: number; type: string; ref: string | null; label: string; is_professionnel: boolean;
    description: string | null; parent_id: number | null; tier_category_id: number | null;
    type_approbateur_id: number | null;
    address: string | null; country_id: number | null; region_id: number | null; city_id: number | null;
    legal_form: string | null; if_fiscal: string | null; ice: string | null; rc: string | null;
    cnss: string | null; tp: string | null; rib: string | null; emploi: string | null;
    email: string | null; telephone: string | null; website: string | null; fax: string | null;
    linkedin: string | null; twitter: string | null; facebook: string | null; instagram: string | null;
    status: string;
}

const TAB_LABELS = ['Identification', 'Localisation', 'Légal & Fiscal', 'Contact & Réseaux'];

export default function Edit({
    tier, type, typeLabel, tierCategories, countries, regions, cities, legalForms, parents, typesApprobateur = [],
}: {
    tier: TierData; type: string; typeLabel: string;
    tierCategories: SelectItem[]; countries: SelectItem[]; regions: RegionItem[];
    cities: CityItem[]; legalForms: string[]; parents: ParentItem[]; typesApprobateur?: SelectItem[];
}) {
    const [activeTab, setActiveTab] = useState(0);

    const { data, setData, patch, processing, errors } = useForm({
        ref: tier.ref || '', label: tier.label, is_professionnel: tier.is_professionnel, description: tier.description || '',
        parent_id: tier.parent_id ? String(tier.parent_id) : '', tier_category_id: tier.tier_category_id ? String(tier.tier_category_id) : '',
        type_approbateur_id: tier.type_approbateur_id ? String(tier.type_approbateur_id) : '',
        address: tier.address || '', country_id: tier.country_id ? String(tier.country_id) : '',
        region_id: tier.region_id ? String(tier.region_id) : '', city_id: tier.city_id ? String(tier.city_id) : '',
        legal_form: tier.legal_form || '',
        if_fiscal: tier.if_fiscal || '', ice: tier.ice || '', rc: tier.rc || '',
        cnss: tier.cnss || '', tp: tier.tp || '', rib: tier.rib || '', emploi: tier.emploi || '',
        email: tier.email || '', telephone: tier.telephone || '', website: tier.website || '', fax: tier.fax || '',
        linkedin: tier.linkedin || '', twitter: tier.twitter || '', facebook: tier.facebook || '', instagram: tier.instagram || '',
        status: tier.status,
    });

    const [filteredRegions, setFilteredRegions] = useState<RegionItem[]>(
        data.country_id ? regions.filter(r => String(r.country_id) === data.country_id) : regions
    );
    const [filteredCities, setFilteredCities] = useState<CityItem[]>(
        data.region_id ? cities.filter(c => String(c.region_id) === data.region_id) : cities
    );

    const isFirstCountry = useRef(true);
    const isFirstRegion = useRef(true);


    useEffect(() => {
        if (isFirstCountry.current) { isFirstCountry.current = false; return; }
        if (data.country_id) {
            setFilteredRegions(regions.filter(r => String(r.country_id) === String(data.country_id)));
            setData(prev => ({ ...prev, region_id: '', city_id: '' }));
            setFilteredCities([]);
        } else {
            setFilteredRegions(regions);
        }
    }, [data.country_id]);

    useEffect(() => {
        if (isFirstRegion.current) { isFirstRegion.current = false; return; }
        if (data.region_id) {
            setFilteredCities(cities.filter(c => String(c.region_id) === String(data.region_id)));
            setData(prev => ({ ...prev, city_id: '' }));
        } else {
            setFilteredCities(cities);
        }
    }, [data.region_id]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route(`tiers.${type}.update`, tier.id));
    };

    const inputCls = "block w-full rounded-2xl border border-slate-200/85 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 text-xs py-3 px-4 focus:outline-none focus:bg-white dark:focus:bg-slate-950 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all duration-200 text-slate-800 dark:text-slate-200";
    const labelCls = "block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5";

    return (
        <AuthenticatedLayout header={
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 max-w-5xl mx-auto">
                <div>
                    <div className="flex items-center space-x-2 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
                        <span>DDB</span><span>/</span><span>{typeLabel}s</span><span>/</span>
                        <span className="text-indigo-650 dark:text-indigo-400">Modifier</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                        Modifier : <span className="text-indigo-655 dark:text-indigo-400">{tier.label}</span>
                    </h2>
                </div>
                <Link href={route(`tiers.${type}.index`)} className="inline-flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs uppercase tracking-widest rounded-2xl h-[42px] px-6 hover:bg-slate-200 transition-all shrink-0">
                    Retour à la liste
                </Link>
            </div>
        }>
            <Head title={`Modifier ${typeLabel}`} />
            <div className="max-w-5xl mx-auto">
                <form onSubmit={submit} className="space-y-5">

                    {/* Tab Navigation */}
                    <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-2 backdrop-blur-xl flex space-x-1">
                        {TAB_LABELS.map((tab, i) => (
                            <button key={i} type="button" onClick={() => setActiveTab(i)}
                                className={`flex-1 py-2.5 px-4 rounded-2xl text-xs font-extrabold uppercase tracking-wider transition-all duration-200 ${
                                    activeTab === i ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-500 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
                                }`}>{tab}</button>
                        ))}
                    </div>

                    {activeTab === 0 && (
                        <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 backdrop-blur-xl space-y-4">
                            <h3 className="text-xs font-extrabold text-slate-800 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/60 pb-3">Identification</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>Nom / Raison Sociale <span className="text-rose-500">*</span></label>
                                    <input className={inputCls} value={data.label} onChange={e => setData('label', e.target.value)} />
                                    <InputError message={errors.label} className="mt-1" />
                                </div>
                                <div>
                                    <label className={labelCls}>Référence</label>
                                    <input className={`${inputCls} font-mono`} value={data.ref} onChange={e => setData('ref', e.target.value)} />
                                    <InputError message={errors.ref} className="mt-1" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className={labelCls}>Catégorie de Tiers</label>
                                    <select className={inputCls} value={data.tier_category_id} onChange={e => setData('tier_category_id', e.target.value)}>
                                        <option value="">Choisir...</option>
                                        {tierCategories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelCls}>Parent (Société mère)</label>
                                    <select className={inputCls} value={data.parent_id} onChange={e => setData('parent_id', e.target.value)}>
                                        <option value="">Aucun parent</option>
                                        {parents.map(p => <option key={p.id} value={p.id}>{p.label}{p.ref ? ` (${p.ref})` : ''}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelCls}>Type d'Approbateur (si applicable)</label>
                                    <select className={inputCls} value={data.type_approbateur_id} onChange={e => setData('type_approbateur_id', e.target.value)}>
                                        <option value="">Aucun</option>
                                        {typesApprobateur.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                                    </select>
                                    <InputError message={errors.type_approbateur_id} className="mt-1" />
                                </div>
                            </div>
                            <div>
                                <label className={labelCls}>Description</label>
                                <textarea rows={3} className={`${inputCls} resize-none`} value={data.description} onChange={e => setData('description', e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center space-x-3 p-4 bg-slate-50 dark:bg-slate-950/30 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
                                    <button type="button" onClick={() => setData('is_professionnel', !data.is_professionnel)}
                                        className={`shrink-0 relative h-6 w-11 rounded-full transition-all duration-300 ${data.is_professionnel ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-300 ${data.is_professionnel ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                    </button>
                                    <div>
                                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Professionnel</div>
                                        <div className="text-[9px] text-slate-400">{data.is_professionnel ? 'Personne morale' : 'Particulier'}</div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <button type="button" onClick={() => setData('status', 'actif')} className={`py-3 rounded-2xl text-xs font-extrabold uppercase tracking-wider transition-all ${data.status === 'actif' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30' : 'bg-slate-50 text-slate-400 border border-transparent'}`}>Actif</button>
                                    <button type="button" onClick={() => setData('status', 'inactif')} className={`py-3 rounded-2xl text-xs font-extrabold uppercase tracking-wider transition-all ${data.status === 'inactif' ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 border border-slate-200' : 'bg-slate-50 text-slate-400 border border-transparent'}`}>Inactif</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 1 && (
                        <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 backdrop-blur-xl space-y-4">
                            <h3 className="text-xs font-extrabold text-slate-800 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/60 pb-3">Localisation & Adresse</h3>
                            <div>
                                <label className={labelCls}>Adresse complète</label>
                                <input className={inputCls} value={data.address} onChange={e => setData('address', e.target.value)} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className={labelCls}>Pays</label>
                                    <select className={inputCls} value={data.country_id} onChange={e => setData('country_id', e.target.value)}>
                                        <option value="">Choisir...</option>
                                        {countries.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelCls}>Région</label>
                                    <select className={inputCls} value={data.region_id} onChange={e => setData('region_id', e.target.value)} disabled={!data.country_id}>
                                        <option value="">Choisir...</option>
                                        {filteredRegions.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelCls}>Ville</label>
                                    <select className={inputCls} value={data.city_id} onChange={e => setData('city_id', e.target.value)} disabled={!data.region_id}>
                                        <option value="">Choisir...</option>
                                        {filteredCities.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 2 && (
                        <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 backdrop-blur-xl space-y-4">
                            <h3 className="text-xs font-extrabold text-slate-800 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/60 pb-3">Informations Légales & Fiscales</h3>
                            <div>
                                <label className={labelCls}>Forme Juridique</label>
                                <select className={inputCls} value={data.legal_form} onChange={e => setData('legal_form', e.target.value)}>
                                    <option value="">Choisir...</option>
                                    {legalForms.map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { key: 'if_fiscal', label: 'IF — Identification Fiscale' },
                                    { key: 'ice', label: 'ICE — Identifiant Commun' },
                                    { key: 'rc', label: 'RC — Registre de Commerce' },
                                    { key: 'cnss', label: 'CNSS — Sécurité Sociale' },
                                    { key: 'tp', label: 'TP — Taxe Professionnelle' },
                                    { key: 'rib', label: 'RIB Bancaire' },
                                    { key: 'emploi', label: 'Emploi / Fonction du Contact' },
                                ].map(({ key, label }) => (
                                    <div key={key}>
                                        <label className={labelCls}>{label}</label>
                                        <input className={`${inputCls} font-mono`} value={(data as any)[key]} onChange={e => setData(key as any, e.target.value)} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 3 && (
                        <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 backdrop-blur-xl space-y-4">
                            <h3 className="text-xs font-extrabold text-slate-800 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/60 pb-3">Contact & Réseaux Sociaux</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { key: 'email', label: 'E-mail', type: 'email' }, { key: 'telephone', label: 'Téléphone' },
                                    { key: 'website', label: 'Site Web' }, { key: 'fax', label: 'Fax' },
                                ].map(({ key, label, type }) => (
                                    <div key={key}><label className={labelCls}>{label}</label><input type={type || 'text'} className={inputCls} value={(data as any)[key]} onChange={e => setData(key as any, e.target.value)} /></div>
                                ))}
                            </div>
                            <hr className="border-slate-100 dark:border-slate-800/60" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {['linkedin', 'twitter', 'facebook', 'instagram'].map(key => (
                                    <div key={key}><label className={labelCls}>{key.charAt(0).toUpperCase() + key.slice(1)}</label><input className={inputCls} value={(data as any)[key]} onChange={e => setData(key as any, e.target.value)} /></div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                        <div className="flex space-x-2">
                            {activeTab > 0 && <button type="button" onClick={() => setActiveTab(activeTab - 1)} className="inline-flex items-center space-x-2 px-5 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 font-bold text-xs uppercase rounded-2xl hover:bg-slate-200 transition-all"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg><span>Précédent</span></button>}
                            {activeTab < TAB_LABELS.length - 1 && <button type="button" onClick={() => setActiveTab(activeTab + 1)} className="inline-flex items-center space-x-2 px-5 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 font-bold text-xs uppercase rounded-2xl hover:bg-slate-200 transition-all"><span>Suivant</span><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg></button>}
                        </div>
                        <div className="flex items-center space-x-3">
                            <Link href={route(`tiers.${type}.index`)} className="px-5 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 font-bold text-xs uppercase rounded-2xl hover:bg-slate-200 transition-all">Annuler</Link>
                            <button type="submit" disabled={processing} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-indigo-500/20 active:scale-[0.97] transition-all disabled:opacity-60">
                                {processing ? 'Enregistrement...' : 'Enregistrer les modifications'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
