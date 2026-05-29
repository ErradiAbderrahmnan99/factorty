import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';

export default function Dashboard() {
    const user = usePage().props.auth.user;

    // Mock stats for premium visuals
    const stats = [
        {
            title: 'Chiffre d\'Affaires (Ventes)',
            value: '142,350.00 DH',
            change: '+12.4% vs mois dernier',
            isPositive: true,
            color: 'from-blue-500 to-indigo-600',
            icon: (
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        {
            title: 'Demandes d\'Achat Actives',
            value: '18 Demandes',
            change: '4 en attente d\'approbation',
            isPositive: false,
            color: 'from-purple-500 to-pink-600',
            icon: (
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
            )
        },
        {
            title: 'Valorisation du Stock',
            value: '584,200.00 DH',
            change: '1,240 articles référencés',
            isPositive: true,
            color: 'from-amber-500 to-orange-600',
            icon: (
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
            )
        },
        {
            title: 'Marge Nette (Comptabilité)',
            value: '24.8 %',
            change: '+3.1% ce trimestre',
            isPositive: true,
            color: 'from-emerald-500 to-teal-600',
            icon: (
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            )
        }
    ];

    const recentActivities = [
        { id: 1, type: 'vente', ref: 'DEV-2026-0042', desc: 'Nouveau devis généré pour Client OCP', amount: '45,000 DH', time: 'Il y a 10 min', status: 'En attente' },
        { id: 2, type: 'achat', ref: 'CMD-ACH-0982', desc: 'Commande d\'achat validée - Fournisseur Ingelec', amount: '12,800 DH', time: 'Il y a 45 min', status: 'Validé' },
        { id: 3, type: 'stock', ref: 'MVT-002891', desc: 'Réception de marchandises - Lot câbles cuivre', amount: '+500 unités', time: 'Il y a 2 heures', status: 'Complété' },
        { id: 4, type: 'compta', ref: 'PC-2026-0129', desc: 'Saisie pièce comptable de paie Mai 2026', amount: '84,000 DH', time: 'Il y a 3 heures', status: 'Enregistré' },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                    <div>
                        <h2 className="text-2xl font-extrabold text-white tracking-tight">
                            Tableau de Bord Principal
                        </h2>
                        <p className="text-slate-400 text-xs mt-1">
                            Aperçu analytique global de vos opérations de vente, achat, stock et comptabilité.
                        </p>
                    </div>
                    <div className="flex items-center space-x-3 shrink-0">
                        <button className="flex items-center space-x-2 bg-slate-900 border border-slate-800 hover:bg-slate-850 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 transition-all duration-200">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Exporter PDF</span>
                        </button>
                        <button className="flex items-center space-x-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            <span>Nouvelle Pièce</span>
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Tableau de Bord" />

            <div className="space-y-8">
                {/* Greeting Banner */}
                <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-tr from-slate-900 via-indigo-950/20 to-purple-950/20 p-8 shadow-2xl backdrop-blur-xl">
                    <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
                    <div className="relative z-10 space-y-2">
                        <h3 className="text-xl md:text-2xl font-bold text-white">
                            Bienvenue, <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">{user.name}</span> 👋
                        </h3>
                        <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
                            Le système ERP Factoraty est entièrement opérationnel. Vous avez des tâches d'approbations d'achat en attente et vos comptes d'écritures pour ce mois sont prêts pour la révision de clôture.
                        </p>
                    </div>
                </div>

                {/* Grid of Key Analytics Cards */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="relative overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6 shadow-xl backdrop-blur-md hover:border-slate-700/80 transition-all duration-300 group">
                            <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.title}</p>
                                    <h4 className="text-2xl font-bold text-white tracking-tight">{stat.value}</h4>
                                </div>
                                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr ${stat.color} shadow-md group-hover:scale-110 transition-transform duration-300`}>
                                    {stat.icon}
                                </div>
                            </div>
                            <div className="mt-4 flex items-center space-x-2">
                                <span className={`flex items-center text-xs font-bold ${stat.isPositive ? 'text-emerald-400' : 'text-slate-400'}`}>
                                    {stat.isPositive ? (
                                        <svg className="mr-1 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                        </svg>
                                    ) : (
                                        <svg className="mr-1 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                                        </svg>
                                    )}
                                    {stat.change}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Split Layout: Recent Activities & Shortcuts */}
                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Left: Recent Activities (Colspan 2) */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white tracking-tight">Activités Récentes</h3>
                            <button className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition duration-150">Voir tout</button>
                        </div>
                        <div className="overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-900/30 shadow-xl backdrop-blur-md">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-800 bg-slate-900/50">
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Référence</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Montant</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date/Heure</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Statut</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60">
                                        {recentActivities.map((act) => (
                                            <tr key={act.id} className="hover:bg-slate-800/10 transition-colors duration-150">
                                                <td className="px-6 py-4 text-xs font-bold text-white">{act.ref}</td>
                                                <td className="px-6 py-4 text-xs text-slate-300">{act.desc}</td>
                                                <td className="px-6 py-4 text-xs font-medium text-slate-400">{act.amount}</td>
                                                <td className="px-6 py-4 text-xs text-slate-500">{act.time}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                        act.status === 'Validé' || act.status === 'Complété'
                                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                            : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                                    }`}>
                                                        {act.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Right: Quick actions panel */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-white tracking-tight">Raccourcis & Configuration</h3>
                        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/30 p-6 shadow-xl backdrop-blur-md space-y-4">
                            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-3">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assistance & Démo</h4>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Cliquez sur n'importe quel élément du menu latéral pour simuler ou tester un module spécifique. Tous les sous-menus sont interactifs !
                                </p>
                            </div>
                            
                            <div className="space-y-2">
                                <button className="flex w-full items-center justify-between p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/40 hover:bg-slate-850 hover:border-slate-700 text-xs font-semibold text-slate-200 transition-all duration-200">
                                    <div className="flex items-center space-x-3">
                                        <div className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                                            <span className="font-bold">V</span>
                                        </div>
                                        <span>Générer un Devis Client</span>
                                    </div>
                                    <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>

                                <button className="flex w-full items-center justify-between p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/40 hover:bg-slate-850 hover:border-slate-700 text-xs font-semibold text-slate-200 transition-all duration-200">
                                    <div className="flex items-center space-x-3">
                                        <div className="h-7 w-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                                            <span className="font-bold">A</span>
                                        </div>
                                        <span>Créer Demande d'Achat</span>
                                    </div>
                                    <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>

                                <button className="flex w-full items-center justify-between p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/40 hover:bg-slate-850 hover:border-slate-700 text-xs font-semibold text-slate-200 transition-all duration-200">
                                    <div className="flex items-center space-x-3">
                                        <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                                            <span className="font-bold">C</span>
                                        </div>
                                        <span>Saisir Pièce Comptable</span>
                                    </div>
                                    <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
