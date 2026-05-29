import { Head, Link } from '@inertiajs/react';

export default function Welcome() {
    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white">
            <Head title="Factoraty ERP - La suite de gestion moderne" />

            {/* Glowing background orbs */}
            <div className="absolute top-[-20%] left-[-10%] h-[700px] w-[700px] rounded-full bg-indigo-900/10 blur-[130px] filter animate-pulse duration-10000 pointer-events-none" />
            <div className="absolute bottom-[-15%] right-[-10%] h-[800px] w-[800px] rounded-full bg-violet-900/15 blur-[150px] filter animate-pulse duration-7000 pointer-events-none" />
            <div className="absolute top-[40%] right-[30%] h-[350px] w-[350px] rounded-full bg-purple-600/5 blur-[100px] pointer-events-none" />

            {/* Grid pattern background overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-35 pointer-events-none" />

            {/* Navbar */}
            <nav className="relative z-10 mx-auto max-w-7xl px-6 h-20 flex items-center justify-between border-b border-slate-900 bg-slate-950/40 backdrop-blur-md">
                <div className="flex items-center space-x-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 shadow-md shadow-indigo-500/20">
                        <span className="text-white font-bold text-lg">F</span>
                    </div>
                    <span className="text-lg font-bold tracking-wider text-white">
                        FACTORATY<span className="text-indigo-400 font-medium">ERP</span>
                    </span>
                </div>
                
                <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-400">
                    <a href="#features" className="hover:text-white transition duration-200">Modules</a>
                    <a href="#advantages" className="hover:text-white transition duration-200">Avantages</a>
                    <a href="#workflow" className="hover:text-white transition duration-200">Fonctionnalités</a>
                </div>

                <div className="flex items-center">
                    <Link
                        href={route('login')}
                        className="relative flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-600 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Accéder à l'ERP
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative z-10 mx-auto max-w-7xl px-6 pt-20 pb-24 text-center space-y-8">
                <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 px-4 py-1.5 rounded-full mb-4">
                    <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Version 2.0 Live</span>
                </div>

                <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight max-w-4xl mx-auto">
                    La suite ERP moderne pour gérer votre{' '}
                    <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                        business intelligemment
                    </span>
                </h1>
                
                <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                    Pilotez l'ensemble de votre activité au sein d'une interface unifiée de nouvelle génération. Conçu pour simplifier vos ventes, achats, comptabilité et stocks.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
                    <Link
                        href={route('login')}
                        className="w-full sm:w-auto relative flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-500/20 hover:from-indigo-600 hover:to-violet-700 transition-all duration-300 hover:scale-[1.01]"
                    >
                        Se connecter (admin@gmail.com)
                    </Link>
                    <a
                        href="#features"
                        className="w-full sm:w-auto flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900/30 hover:bg-slate-850 px-8 py-3.5 text-sm font-semibold text-slate-300 transition-all duration-200"
                    >
                        Découvrir les modules
                    </a>
                </div>

                {/* Simulated dashboard preview frame */}
                <div className="relative pt-16 max-w-5xl mx-auto">
                    <div className="absolute inset-0 bg-indigo-500/10 blur-3xl rounded-3xl -z-10 pointer-events-none" />
                    <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4 shadow-2xl backdrop-blur-xl">
                        <div className="flex items-center space-x-2 pb-4 border-b border-slate-900">
                            <div className="h-3 w-3 rounded-full bg-red-500/80" />
                            <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                            <div className="h-3 w-3 rounded-full bg-green-500/80" />
                            <span className="text-[10px] text-slate-600 font-medium pl-2">demo.factoraty-erp.com</span>
                        </div>
                        <div className="pt-4 overflow-hidden rounded-xl">
                            <div className="grid grid-cols-3 gap-4 text-left">
                                <div className="p-4 bg-slate-900/40 border border-slate-850 rounded-xl space-y-1">
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Module Ventes</span>
                                    <h4 className="text-lg font-extrabold text-indigo-400">142,350 DH</h4>
                                </div>
                                <div className="p-4 bg-slate-900/40 border border-slate-850 rounded-xl space-y-1">
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Achats en attente</span>
                                    <h4 className="text-lg font-extrabold text-violet-400">18 Commandes</h4>
                                </div>
                                <div className="p-4 bg-slate-900/40 border border-slate-850 rounded-xl space-y-1">
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Marge Net</span>
                                    <h4 className="text-lg font-extrabold text-emerald-400">24.8 %</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Module Section */}
            <section id="features" className="relative z-10 mx-auto max-w-7xl px-6 py-24 border-t border-slate-900/50">
                <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Écosystème Connecté</span>
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                        Quatre modules clés intégrés nativement
                    </h2>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        Plus besoin d'outils tiers. Toutes vos branches administratives communiquent en temps réel au sein d'une structure logicielle unique.
                    </p>
                </div>

                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                    {/* Vente */}
                    <div className="rounded-2xl border border-slate-850 bg-slate-900/20 p-6 space-y-4 hover:border-indigo-500/30 transition-all duration-300 backdrop-blur-md">
                        <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-white">Module Ventes</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Scannez l'intégralité du tunnel de vente : création de Devis, Commandes clients, Livraisons, facturations clients, Avoirs et Contrats récurrents.
                        </p>
                    </div>

                    {/* Achat */}
                    <div className="rounded-2xl border border-slate-850 bg-slate-900/20 p-6 space-y-4 hover:border-violet-500/30 transition-all duration-300 backdrop-blur-md">
                        <div className="h-10 w-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-white">Module Achats</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Organisez vos dépenses : Demandes d'achat internes, groupes d'achat, Demandes de Prix (RFQ), Commandes Achat, Réceptions, Factures fournisseurs et Avoirs.
                        </p>
                    </div>

                    {/* Stock */}
                    <div className="rounded-2xl border border-slate-850 bg-slate-900/20 p-6 space-y-4 hover:border-amber-500/30 transition-all duration-300 backdrop-blur-md">
                        <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-white">Module Stocks</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Contrôlez vos approvisionnements : Fiches articles détaillées, mouvements de stock d'entrées/sorties précis et valorisation comptable automatisée.
                        </p>
                    </div>

                    {/* Comptabilité */}
                    <div className="rounded-2xl border border-slate-850 bg-slate-900/20 p-6 space-y-4 hover:border-emerald-500/30 transition-all duration-300 backdrop-blur-md">
                        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-white">Comptabilité</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Validez vos flux comptables : Plan Comptable marocain complet, Comptes Comptables paramétrables et saisie directe de Pièces Comptables structurées.
                        </p>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative z-10 mx-auto max-w-5xl px-6 py-16 mb-24">
                <div className="rounded-3xl border border-slate-800 bg-gradient-to-tr from-slate-900/80 via-indigo-950/20 to-purple-950/20 p-12 text-center space-y-6 shadow-2xl backdrop-blur-xl">
                    <h2 className="text-3xl font-extrabold text-white">Prêt à transformer la gestion de votre activité ?</h2>
                    <p className="text-slate-400 text-sm max-w-xl mx-auto">
                        Connectez-vous instantanément avec vos identifiants administrateurs simulés pour accéder à tous les widgets et tester la réactivité.
                    </p>
                    <div className="pt-4">
                        <Link
                            href={route('login')}
                            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-500/20 hover:from-indigo-600 hover:to-violet-700 transition-all duration-300 hover:scale-[1.02]"
                        >
                            Démarrer l'expérience
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 border-t border-slate-900 py-12 text-center text-xs text-slate-500">
                <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center space-x-2">
                        <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-xs">F</div>
                        <span className="font-semibold text-slate-400">FACTORATY ERP</span>
                    </div>
                    <div>&copy; {new Date().getFullYear()} Factoraty ERP. Tous droits réservés.</div>
                </div>
            </footer>
        </div>
    );
}
