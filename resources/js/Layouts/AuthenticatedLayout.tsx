import Dropdown from '@/Components/Dropdown';
import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useState, useEffect, useRef } from 'react';

interface ERPItem {
    name: string;
    key: string;
    group?: string;
    href?: string;
}

interface ERPModule {
    id: string;
    title: string;
    icon: ReactNode;
    items: ERPItem[];
}

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const user = usePage().props.auth.user;
    const { url } = usePage();
    const currentPath = url.split('?')[0];

    const erpModules: ERPModule[] = [
        {
            id: 'ddb',
            title: 'DDB (Données de base)',
            icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            ),
            items: [
                // Group 1: Produits
                { name: 'Catégorie de produits', key: 'prod_cat', group: 'Produits', href: route('product-categories.index') },
                { name: 'Produits', key: 'prod_list', group: 'Produits', href: route('products.index') },
                { name: 'Catégorie d\'unité', key: 'unit_cat', group: 'Produits', href: route('unit-categories.index') },
                { name: 'Unités', key: 'unit_list', group: 'Produits', href: route('units.index') },
                // Group 2: Tiers
                { name: 'Prospects', key: 'prospects', group: 'Tiers', href: route('tiers.prospect.index') },
                { name: 'Clients', key: 'clients', group: 'Tiers', href: route('tiers.client.index') },
                { name: 'Fournisseurs', key: 'fournisseurs', group: 'Tiers', href: route('tiers.fournisseur.index') },
                // Group 3: Paramètres Tiers
                { name: 'Catégories de Tiers', key: 'tier_cat', group: 'Paramètres Tiers', href: route('tier-categories.index') },
                { name: 'Pays', key: 'countries', group: 'Paramètres Tiers', href: route('countries.index') },
                { name: 'Régions', key: 'regions', group: 'Paramètres Tiers', href: route('regions.index') },
                { name: 'Villes', key: 'cities', group: 'Paramètres Tiers', href: route('cities.index') },
                { name: 'Branches', key: 'branches', group: 'Paramètres Tiers', href: route('branches.index') },
                { name: 'Entités', key: 'entities', group: 'Paramètres Tiers', href: route('entities.index') },
                { name: 'Devises', key: 'devises', group: 'Paramètres Tiers', href: route('devises.index') },
                { name: 'Employés', key: 'employees', group: 'Paramètres Tiers', href: route('employees.index') },
                { name: 'Origines', key: 'origines', group: 'Paramètres Tiers', href: route('origines.index') },
                { name: 'Types d\'Approbateur', key: 'types_approbateur', group: 'Paramètres Tiers', href: route('types-approbateur.index') },
            ],
        },
        {
            id: 'vente',
            title: 'Ventes',
            icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            items: [
                { name: 'Devis', key: 'devis', href: route('devis.index') },
                { name: 'Commande Client', key: 'commande', href: route('commandes.index') },
                { name: 'Bon de Livraison', key: 'livraison', href: route('livraisons.index') },
                { name: 'Retour Vente', key: 'reture', href: route('retours-vente.index') },
                { name: 'Facture Vente', key: 'facture', href: route('factures-vente.index') },
                { name: 'Avoir Vente', key: 'avoir', href: route('avoirs-vente.index') },
                { name: 'Contrat Vente', key: 'contrat', href: route('contrats-vente.index') },
            ],
        },
        {
            id: 'achat',
            title: 'Achats',
            icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
            ),
            items: [
                { name: 'Contrats Achat', key: 'contrat_a', href: route('contrats-achat.index') },
                { name: "Demandes d'Achat", key: 'demande_a', href: route('demandes-achat.index') },
                { name: 'Demandes de Prix (RFQ)', key: 'demande_p', href: route('demandes-prix.index') },
                { name: 'Commandes Achat', key: 'commande_a', href: route('commandes-achat.index') },
                { name: 'Bons de Réception', key: 'reception', href: route('receptions.index') },
                { name: 'Retours Achat', key: 'retour_a', href: route('retours-achat.index') },
                { name: 'Factures Fournisseur', key: 'facture_f', href: route('factures-achat.index') },
                { name: 'Avoirs Fournisseur', key: 'avoir_f', href: route('avoirs-achat.index') },
                { name: 'Rapports Achat', key: 'rapport' },
            ],
        },
        {
            id: 'reglement',
            title: 'Règlements',
            icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
            ),
            items: [
                { name: 'Règlements', key: 'reglements', href: route('reglements.index') },
                { name: 'Modes de Règlement', key: 'modes_reglement', href: route('modes-reglement.index') },
                { name: 'Conditions de Règlement', key: 'conditions_reglement', href: route('conditions-reglement.index') },
                { name: 'Statuts de Règlement', key: 'statuts_reglement', href: route('statuts-reglement.index') },
                { name: 'Comptes Bancaires', key: 'comptes_bancaires', href: route('comptes-bancaires.index') },
            ],
        },
        {
            id: 'accounting',
            title: 'Comptabilité',
            icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            ),
            items: [
                { name: 'Pièces Comptables', key: 'piece' },
                { name: 'Plan Comptable', key: 'plan' },
                { name: 'Comptes Comptables', key: 'compt' },
                { name: 'Paramétrage', key: 'param' },
            ],
        },
        {
            id: 'stock',
            title: 'Stocks & Articles',
            icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
            ),
            items: [
                { name: 'Entrepôts', key: 'entrepots', href: route('entrepots.index') },
                { name: 'Entrées de Stock', key: 'entrees_stock', href: route('entrees-stock.index') },
                { name: 'Sorties de Stock', key: 'sorties_stock', href: route('sorties-stock.index') },
            ],
        },
    ];

    // Theme state (default is light)
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('theme');
            return (saved === 'dark' || saved === 'light') ? saved : 'light';
        }
        return 'light';
    });

    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    };

    // Ref and Effect to preserve sidebar scroll position across navigation
    const navRef = useRef<HTMLElement>(null);
    useEffect(() => {
        const nav = navRef.current;
        if (!nav) return;
        const savedScroll = sessionStorage.getItem('sidebar-scroll');
        if (savedScroll) {
            nav.scrollTop = parseInt(savedScroll, 10);
        }
        const handleScroll = () => {
            sessionStorage.setItem('sidebar-scroll', nav.scrollTop.toString());
        };
        nav.addEventListener('scroll', handleScroll);
        return () => {
            nav.removeEventListener('scroll', handleScroll);
        };
    }, []);

    // Sidebar collapsible state initialized dynamically based on active URL
    const [openModules, setOpenModules] = useState<{ [key: string]: boolean }>(() => {
        const initial: { [key: string]: boolean } = {
            ddb: false,
            vente: false,
            achat: false,
            reglement: false,
            accounting: false,
            stock: false,
        };

        let matchedAny = false;
        erpModules.forEach((mod) => {
            const hasActiveChild = mod.items.some((item) => {
                if (!item.href) return false;
                try {
                    const itemPath = item.href.startsWith('http')
                        ? new URL(item.href).pathname
                        : item.href.split('?')[0];
                    return currentPath === itemPath || currentPath.startsWith(itemPath + '/');
                } catch (e) {
                    return false;
                }
            });
            if (hasActiveChild) {
                initial[mod.id] = true;
                matchedAny = true;
            }
        });

        // Default to ddb open if no route matches
        if (!matchedAny) {
            initial.ddb = true;
        }

        return initial;
    });

    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    
    // Custom Toast state for mock module interactions
    const [toast, setToast] = useState<{ show: boolean; title: string; message: string } | null>(null);

    const toggleModule = (module: string) => {
        setOpenModules((prev) => ({
            ...prev,
            [module]: !prev[module],
        }));
    };

    const triggerMockAlert = (moduleName: string) => {
        setToast({
            show: true,
            title: `Module ${moduleName}`,
            message: "Ce module est prêt pour l'intégration de la base de données. L'interface et les schémas sont validés !",
        });
        setTimeout(() => setToast(null), 4000);
    };

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans antialiased overflow-hidden transition-colors duration-200">
            {/* Background Blur Accents for Dark mode only */}
            <div className="hidden dark:block absolute top-[-10%] left-[-10%] h-[400px] w-[400px] rounded-full bg-indigo-900/10 blur-[100px] pointer-events-none" />
            <div className="hidden dark:block absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-violet-900/10 blur-[120px] pointer-events-none" />

            {/* Sidebar (Desktop) - Metronic Dark High Contrast Theme */}
            <aside className="hidden md:flex flex-col w-72 bg-[#1e1e2d] border-r border-[#2b2b40] shrink-0 z-20">
                {/* Logo Section */}
                <div className="flex items-center space-x-3 p-6 border-b border-[#2b2b40]">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 shadow-md shadow-indigo-500/20">
                        <span className="text-white font-bold text-lg">F</span>
                    </div>
                    <span className="text-lg font-bold tracking-wider text-white">
                        FACTORATY<span className="text-indigo-400 font-medium">ERP</span>
                    </span>
                </div>

                {/* Navigation Menu */}
                <nav ref={navRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4 custom-scrollbar">
                    <div className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Modules ERP
                    </div>
                    
                    {erpModules.map((mod) => (
                        <div key={mod.id} className="space-y-1">
                            <button
                                onClick={() => toggleModule(mod.id)}
                                className={`flex w-full items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                                    openModules[mod.id] 
                                        ? 'bg-slate-800/40 text-indigo-400' 
                                        : 'text-slate-400 hover:bg-slate-800/20 hover:text-slate-200'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <span className={`${openModules[mod.id] ? 'text-indigo-400' : 'text-slate-500'}`}>
                                        {mod.icon}
                                    </span>
                                    <span>{mod.title}</span>
                                </div>
                                <svg
                                    className={`h-4 w-4 transform transition-transform duration-200 ${
                                        openModules[mod.id] ? 'rotate-180' : ''
                                    }`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {openModules[mod.id] && (
                                <div className="pl-9 pr-2 py-1 space-y-1 border-l border-slate-800/80 ml-5 mt-1">
                                    {mod.items.map((item, idx) => {
                                        // Render Metronic-style grouping header if it's the first item of that group
                                        const showGroupHeader = item.group && (idx === 0 || mod.items[idx - 1].group !== item.group);
                                        
                                        let isItemActive = false;
                                        if (item.href) {
                                            try {
                                                const itemPath = item.href.startsWith('http')
                                                    ? new URL(item.href).pathname
                                                    : item.href.split('?')[0];
                                                isItemActive = currentPath === itemPath || currentPath.startsWith(itemPath + '/');
                                            } catch (e) {
                                                isItemActive = false;
                                            }
                                        }

                                        return (
                                            <div key={item.key} className="space-y-1">
                                                {showGroupHeader && (
                                                    <div className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest pt-2 pb-1 pl-3">
                                                        {item.group}
                                                    </div>
                                                )}
                                                {item.href ? (
                                                    <Link
                                                        href={item.href}
                                                        className={`block w-full text-left py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-150 ${
                                                            isItemActive
                                                                ? 'bg-slate-800/40 text-indigo-400 font-bold border-l-2 border-indigo-500 pl-2'
                                                                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/30'
                                                        }`}
                                                    >
                                                        {item.name}
                                                    </Link>
                                                ) : (
                                                    <button
                                                        onClick={() => triggerMockAlert(`${mod.title} / ${item.name}`)}
                                                        className="block w-full text-left py-2 px-3 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800/30 transition-all duration-150"
                                                    >
                                                        {item.name}
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </nav>

                {/* Sidebar Footer User Info */}
                <div className="p-4 border-t border-[#2b2b40] bg-slate-950/20">
                    <div className="flex items-center space-x-3 px-2">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-800 border border-slate-750 flex items-center justify-center font-bold text-slate-200">
                            {user.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                            <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile Sidebar overlay */}
            {mobileSidebarOpen && (
                <div className="fixed inset-0 z-40 flex md:hidden bg-slate-950/80 backdrop-blur-sm">
                    <div className="relative flex flex-col w-72 max-w-[80%] bg-[#1e1e2d] border-r border-[#2b2b40] text-slate-100">
                        <div className="flex items-center justify-between p-6 border-b border-[#2b2b40]">
                            <span className="text-lg font-bold tracking-wider text-white">FACTORATY</span>
                            <button onClick={() => setMobileSidebarOpen(false)} className="text-slate-400 hover:text-white">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
                            {erpModules.map((mod) => (
                                <div key={mod.id} className="space-y-1">
                                    <button
                                        onClick={() => toggleModule(mod.id)}
                                        className="flex w-full items-center justify-between px-3 py-2 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800/20"
                                    >
                                        <div className="flex items-center space-x-3">
                                            {mod.icon}
                                            <span>{mod.title}</span>
                                        </div>
                                        <svg className={`h-4 w-4 transform transition-transform ${openModules[mod.id] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {openModules[mod.id] && (
                                        <div className="pl-9 space-y-1 border-l border-slate-800 ml-5">
                                            {mod.items.map((item, idx) => {
                                                const showGroupHeader = item.group && (idx === 0 || mod.items[idx - 1].group !== item.group);
                                                
                                                let isItemActive = false;
                                                if (item.href) {
                                                    try {
                                                        const itemPath = item.href.startsWith('http')
                                                            ? new URL(item.href).pathname
                                                            : item.href.split('?')[0];
                                                        isItemActive = currentPath === itemPath || currentPath.startsWith(itemPath + '/');
                                                    } catch (e) {
                                                        isItemActive = false;
                                                    }
                                                }

                                                return (
                                                    <div key={item.key} className="space-y-1">
                                                        {showGroupHeader && (
                                                            <div className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest pt-2 pb-1 pl-3">
                                                                {item.group}
                                                            </div>
                                                        )}
                                                        {item.href ? (
                                                            <Link
                                                                href={item.href}
                                                                onClick={() => setMobileSidebarOpen(false)}
                                                                className={`block w-full text-left py-1.5 px-3 text-xs font-semibold rounded-lg transition-all ${
                                                                    isItemActive
                                                                        ? 'bg-slate-800/40 text-indigo-400 font-bold border-l-2 border-indigo-500 pl-2'
                                                                        : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                                                                }`}
                                                            >
                                                                {item.name}
                                                            </Link>
                                                        ) : (
                                                            <button
                                                                onClick={() => {
                                                                    setMobileSidebarOpen(false);
                                                                    triggerMockAlert(`${mod.title} / ${item.name}`);
                                                                }}
                                                                className="block w-full text-left py-1.5 px-3 text-xs text-slate-400 hover:text-white hover:bg-slate-800/30 transition-all duration-150"
                                                            >
                                                                {item.name}
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </nav>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
                {/* Topbar - Metronic Clean White / Dark Fluid theme */}
                <header className="flex h-16 items-center justify-between px-6 bg-white dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800/80 backdrop-blur-md shrink-0 transition-colors duration-200">
                    {/* Left: Mobile hamburger & Search bar */}
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setMobileSidebarOpen(true)}
                            className="md:hidden p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40 hover:text-slate-800 dark:hover:text-white"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        
                        {/* Search Input (Metronic style) */}
                        <div className="relative hidden sm:block w-64 md:w-80">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 backdrop-blur-sm transition-all duration-200"
                                placeholder="Rechercher des clients, factures, pièces..."
                            />
                        </div>
                    </div>

                    {/* Right: Theme toggle, indicators, Notifications & Profile */}
                    <div className="flex items-center space-x-4">
                        {/* Live Server Indicator */}
                        <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-semibold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider">Live</span>
                        </div>

                        {/* Theme Toggle Button */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-xl text-slate-500 dark:text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800/30 transition-all duration-150"
                            aria-label="Toggle Theme"
                        >
                            {theme === 'light' ? (
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                            ) : (
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                                </svg>
                            )}
                        </button>

                        {/* Notifications */}
                        <button className="relative p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/30 hover:text-slate-700 dark:hover:text-white transition-all duration-150">
                            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-500" />
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        </button>

                        {/* Dropdown settings */}
                        <div className="relative">
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/30 transition-all duration-150">
                                        <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-sm">
                                            {user.name.charAt(0)}
                                        </div>
                                        <span className="hidden md:block text-xs font-semibold text-slate-750 dark:text-slate-300">{user.name}</span>
                                        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                </Dropdown.Trigger>

                                <Dropdown.Content>
                                    <Dropdown.Link href={route('profile.edit')}>
                                        Profil
                                    </Dropdown.Link>
                                    <Dropdown.Link href={route('logout')} method="post" as="button">
                                        Se déconnecter
                                    </Dropdown.Link>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>
                    </div>
                </header>

                {/* Sub-header / Breadcrumbs (Metronic Style) */}
                {header && (
                    <div className="bg-white dark:bg-slate-900/10 border-b border-slate-200 dark:border-slate-800/40 py-4 px-8 shrink-0 transition-colors duration-200">
                        {header}
                    </div>
                )}

                {/* Dynamic Page Content */}
                <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {children}
                </main>
            </div>

            {/* Premium Toast Alert for Mock Interactivity */}
            {toast && (
                <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-2xl backdrop-blur-lg animate-bounce duration-500">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white">{toast.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{toast.message}</p>
                    </div>
                    <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-350">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
}
