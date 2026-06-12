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

interface Entity {
    id: number;
    label: string;
}

interface Branche {
    id: number;
    label: string;
    name: string;
    email: string | null;
    phone: string | null;
    country_id: number | null;
    region_id: number | null;
    city_id: number | null;
    status: 'active' | 'inactive';
    address: string | null;
    entity_id: number | null;
    country?: Country;
    region?: Region;
    city?: City;
    entity?: Entity;
}

export default function Index({
    branches,
    countries,
    regions,
    cities,
    entities
}: {
    branches: Branche[];
    countries: Country[];
    regions: Region[];
    cities: City[];
    entities: Entity[];
}) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Branche | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Branche | null>(null);

    const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm({
        name: '',
        email: '',
        phone: '',
        country_id: '',
        region_id: '',
        city_id: '',
        status: 'active' as 'active' | 'inactive',
        address: '',
        entity_id: entities[0] ? String(entities[0].id) : ''
    });

    const openCreate = () => {
        reset();
        clearErrors();
        setEditingItem(null);
        if (entities[0]) {
            setData(d => ({ ...d, entity_id: String(entities[0].id) }));
        }
        setIsModalOpen(true);
    };

    const openEdit = (item: Branche) => {
        setData({
            name: item.name,
            email: item.email || '',
            phone: item.phone || '',
            country_id: item.country_id ? String(item.country_id) : '',
            region_id: item.region_id ? String(item.region_id) : '',
            city_id: item.city_id ? String(item.city_id) : '',
            status: item.status,
            address: item.address || '',
            entity_id: item.entity_id ? String(item.entity_id) : ''
        });
        clearErrors();
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingItem) {
            patch(route('branches.update', editingItem.id), {
                onSuccess: () => { setIsModalOpen(false); reset(); }
            });
        } else {
            post(route('branches.store'), {
                onSuccess: () => { setIsModalOpen(false); reset(); }
            });
        }
    };

    const filteredRegions = data.country_id
        ? regions.filter(r => String(r.country_id) === data.country_id)
        : [];

    const filteredCities = data.region_id
        ? cities.filter(c => String(c.region_id) === data.region_id)
        : [];

    const handleCountryChange = (cId: string) => {
        setData(d => ({ ...d, country_id: cId, region_id: '', city_id: '' }));
    };

    const handleRegionChange = (rId: string) => {
        setData(d => ({ ...d, region_id: rId, city_id: '' }));
    };

    const inputClass = "block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-xs py-2.5 px-3.5 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-all text-slate-800 dark:text-slate-100 placeholder:text-slate-400 font-medium";
    const labelClass = "block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide";

    return (
        <AuthenticatedLayout header={
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 max-w-7xl mx-auto">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                        <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">DDB / Branches</p>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                            Branches
                            <span className="text-[11px] font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800/50 px-2 py-0.5 rounded-lg">
                                {branches.length}
                            </span>
                        </h2>
                    </div>
                </div>
                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-2xl h-10 px-5 transition-all shadow-lg shadow-violet-500/25 active:scale-95 hover:shadow-violet-500/40"
                >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Nouvelle Branche
                </button>
            </div>
        }>
            <Head title="Branches" />

            <div className="max-w-7xl mx-auto space-y-4">

                {/* Stats bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        {
                            label: 'Total',
                            value: branches.length,
                            color: 'from-violet-500 to-indigo-500',
                            bg: 'bg-violet-50 dark:bg-violet-900/20',
                            border: 'border-violet-200/60 dark:border-violet-800/40',
                            text: 'text-violet-700 dark:text-violet-300'
                        },
                        {
                            label: 'Actives',
                            value: branches.filter(b => b.status === 'active').length,
                            color: 'from-emerald-400 to-teal-500',
                            bg: 'bg-emerald-50 dark:bg-emerald-900/20',
                            border: 'border-emerald-200/60 dark:border-emerald-800/40',
                            text: 'text-emerald-700 dark:text-emerald-300'
                        },
                        {
                            label: 'Inactives',
                            value: branches.filter(b => b.status === 'inactive').length,
                            color: 'from-rose-400 to-pink-500',
                            bg: 'bg-rose-50 dark:bg-rose-900/20',
                            border: 'border-rose-200/60 dark:border-rose-800/40',
                            text: 'text-rose-700 dark:text-rose-300'
                        },
                        {
                            label: 'Entités',
                            value: new Set(branches.map(b => b.entity_id).filter(Boolean)).size,
                            color: 'from-amber-400 to-orange-500',
                            bg: 'bg-amber-50 dark:bg-amber-900/20',
                            border: 'border-amber-200/60 dark:border-amber-800/40',
                            text: 'text-amber-700 dark:text-amber-300'
                        }
                    ].map((stat, i) => (
                        <div key={i} className={`${stat.bg} ${stat.border} border rounded-2xl p-4 flex items-center gap-3`}>
                            <div className={`h-8 w-8 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-sm flex-shrink-0`}>
                                <div className="h-2 w-2 bg-white/80 rounded-full" />
                            </div>
                            <div>
                                <p className={`text-xl font-black ${stat.text}`}>{stat.value}</p>
                                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 rounded-2xl overflow-hidden shadow-sm">

                    {/* Table header */}
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/70 bg-slate-50/50 dark:bg-slate-950/20">
                        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Liste des branches</p>
                        <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
                            <span className="text-[10px] text-slate-400 font-medium">{branches.filter(b => b.status === 'active').length} actives</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[800px]">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800/60">
                                    {['Nom', 'Entité', 'Contact', 'Localisation', 'Adresse', 'Statut', 'Actions'].map((h, i) => (
                                        <th key={i} className={`py-3 px-5 text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest ${i >= 5 ? 'text-center' : ''} ${i === 6 ? 'text-right w-24' : ''}`}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {branches.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                    <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Aucune branche</p>
                                                    <p className="text-xs text-slate-400 mt-0.5">Cliquez sur "Nouvelle Branche" pour commencer</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    branches.map(item => (
                                        <tr key={item.id} className="group hover:bg-violet-50/40 dark:hover:bg-violet-950/10 transition-colors">
                                            {/* Name */}
                                            <td className="py-3.5 px-5">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/40 dark:to-indigo-900/40 flex items-center justify-center flex-shrink-0">
                                                        <span className="text-[10px] font-black text-violet-600 dark:text-violet-400">
                                                            {item.name.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.name}</span>
                                                </div>
                                            </td>
                                            {/* Entity */}
                                            <td className="py-3.5 px-5">
                                                {item.entity ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                                                        {item.entity.label}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                                                )}
                                            </td>
                                            {/* Contact */}
                                            <td className="py-3.5 px-5">
                                                <div className="space-y-0.5">
                                                    <div className="text-xs font-medium text-slate-600 dark:text-slate-400">{item.email || <span className="text-slate-300 dark:text-slate-600">—</span>}</div>
                                                    <div className="text-[10px] text-slate-400 font-mono">{item.phone || '—'}</div>
                                                </div>
                                            </td>
                                            {/* Location */}
                                            <td className="py-3.5 px-5">
                                                {(item.city || item.region || item.country) ? (
                                                    <div className="space-y-0.5">
                                                        {item.city && <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">{item.city.label}</div>}
                                                        <div className="text-[10px] text-slate-400">
                                                            {[item.region?.label, item.country?.label].filter(Boolean).join(', ')}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                                                )}
                                            </td>
                                            {/* Address */}
                                            <td className="py-3.5 px-5">
                                                <span className="text-xs text-slate-500 dark:text-slate-400 max-w-[180px] truncate block" title={item.address || ''}>
                                                    {item.address || <span className="text-slate-300 dark:text-slate-600">—</span>}
                                                </span>
                                            </td>
                                            {/* Status */}
                                            <td className="py-3.5 px-5 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                                                    item.status === 'active'
                                                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40'
                                                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40'
                                                }`}>
                                                    <span className={`h-1.5 w-1.5 rounded-full ${item.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                    {item.status === 'active' ? 'Actif' : 'Inactif'}
                                                </span>
                                            </td>
                                            {/* Actions */}
                                            <td className="py-3.5 px-5 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => openEdit(item)}
                                                        className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-all"
                                                        title="Modifier"
                                                    >
                                                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteTarget(item)}
                                                        className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all"
                                                        title="Supprimer"
                                                    >
                                                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {branches.length > 0 && (
                        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-950/10">
                            <p className="text-[10px] text-slate-400 font-medium">{branches.length} branche{branches.length > 1 ? 's' : ''} au total</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Create / Edit Modal ── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl my-8">

                        {/* Modal header */}
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-800/70">
                            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-500/30 flex-shrink-0">
                                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    {editingItem
                                        ? <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        : <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                    }
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                                    {editingItem ? 'Modifier la Branche' : 'Nouvelle Branche'}
                                </h3>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                    {editingItem ? `Modification de "${editingItem.name}"` : 'Remplissez les informations ci-dessous'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal body */}
                        <div className="p-6 max-h-[70vh] overflow-y-auto">
                            <form onSubmit={submit} className="space-y-5">

                                {/* Section: Général */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Général</span>
                                        <span className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className={labelClass}>Nom <span className="text-rose-500 normal-case font-bold">*</span></label>
                                            <input
                                                className={inputClass}
                                                value={data.name}
                                                onChange={e => setData('name', e.target.value)}
                                                placeholder="Branche Principale"
                                                required
                                            />
                                            <InputError message={errors.name} className="mt-1" />
                                        </div>

                                        <div>
                                            <label className={labelClass}>Statut <span className="text-rose-500 normal-case font-bold">*</span></label>
                                            <select
                                                className={inputClass}
                                                value={data.status}
                                                onChange={e => setData('status', e.target.value as any)}
                                            >
                                                <option value="active">Actif</option>
                                                <option value="inactive">Inactif</option>
                                            </select>
                                            <InputError message={errors.status} className="mt-1" />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Téléphone</label>
                                            <input
                                                className={inputClass + ' font-mono'}
                                                value={data.phone}
                                                onChange={e => setData('phone', e.target.value)}
                                                placeholder="0522XXXXXX"
                                            />
                                            <InputError message={errors.phone} className="mt-1" />
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <label className={labelClass}>Email</label>
                                        <input
                                            type="email"
                                            className={inputClass}
                                            value={data.email}
                                            onChange={e => setData('email', e.target.value)}
                                            placeholder="contact@branche.com"
                                        />
                                        <InputError message={errors.email} className="mt-1" />
                                    </div>
                                </div>

                                {/* Section: Localisation */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Localisation</span>
                                        <span className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                                    </div>
                                    <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800/60">
                                        <div>
                                            <label className={labelClass}>Pays</label>
                                            <select
                                                className={inputClass}
                                                value={data.country_id}
                                                onChange={e => handleCountryChange(e.target.value)}
                                            >
                                                <option value="">Choisir...</option>
                                                {countries.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                            </select>
                                            <InputError message={errors.country_id} className="mt-1" />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Région</label>
                                            <select
                                                className={inputClass}
                                                value={data.region_id}
                                                onChange={e => handleRegionChange(e.target.value)}
                                                disabled={!data.country_id}
                                            >
                                                <option value="">Choisir...</option>
                                                {filteredRegions.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                                            </select>
                                            <InputError message={errors.region_id} className="mt-1" />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Ville</label>
                                            <select
                                                className={inputClass}
                                                value={data.city_id}
                                                onChange={e => setData('city_id', e.target.value)}
                                                disabled={!data.region_id}
                                            >
                                                <option value="">Choisir...</option>
                                                {filteredCities.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                            </select>
                                            <InputError message={errors.city_id} className="mt-1" />
                                        </div>
                                    </div>
                                </div>

                                {/* Address */}
                                <div>
                                    <label className={labelClass}>Adresse</label>
                                    <textarea
                                        rows={3}
                                        className={inputClass + ' resize-none'}
                                        value={data.address}
                                        onChange={e => setData('address', e.target.value)}
                                        placeholder="Adresse complète de la branche..."
                                    />
                                    <InputError message={errors.address} className="mt-1" />
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/70">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-xl transition-all shadow-md shadow-violet-500/20 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {processing && (
                                            <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                            </svg>
                                        )}
                                        {processing ? 'Enregistrement...' : 'Enregistrer'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Confirmation Modal ── */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="h-10 w-10 rounded-xl bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center flex-shrink-0">
                                    <svg className="h-5 w-5 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Supprimer la branche</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                                        Êtes-vous sûr de vouloir supprimer <strong className="text-slate-700 dark:text-slate-300">"{deleteTarget.name}"</strong> ? Cette action est irréversible.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 px-6 py-4 bg-slate-50 dark:bg-slate-950/30 border-t border-slate-100 dark:border-slate-800/60">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={() => router.delete(route('branches.destroy', deleteTarget.id), { onSuccess: () => setDeleteTarget(null) })}
                                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-md shadow-rose-500/20 active:scale-95 flex items-center gap-1.5"
                            >
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}