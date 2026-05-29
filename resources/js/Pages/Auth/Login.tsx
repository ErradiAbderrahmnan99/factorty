import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 font-sans antialiased selection:bg-indigo-500 selection:text-white">
            <Head title="Connexion - Factoraty ERP" />

            {/* Glowing dynamic background orbs */}
            <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-purple-900/20 blur-[120px] filter animate-pulse duration-10000" />
            <div className="absolute bottom-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-indigo-900/20 blur-[130px] filter animate-pulse duration-7000" />
            <div className="absolute top-[30%] right-[20%] h-[300px] w-[300px] rounded-full bg-violet-600/10 blur-[90px] filter animate-ping duration-10000" />

            {/* Grid pattern background overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-35" />

            <div className="relative z-10 flex w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/40 shadow-2xl backdrop-blur-xl m-4 md:m-8">
                {/* Left Side: Brand Panel (Hidden on Mobile) */}
                <div className="relative hidden w-1/2 flex-col justify-between p-12 bg-gradient-to-tr from-slate-900 via-indigo-950/80 to-purple-950/60 overflow-hidden md:flex border-r border-slate-800/80">
                    {/* Glowing decorative shape */}
                    <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />
                    
                    {/* Logo/Header */}
                    <div className="flex items-center space-x-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/30">
                            <span className="text-xl font-bold text-white">F</span>
                        </div>
                        <span className="text-xl font-bold tracking-wider text-white">
                            FACTORATY<span className="text-indigo-400 font-medium">ERP</span>
                        </span>
                    </div>

                    {/* Middle: Key message */}
                    <div className="my-auto space-y-6">
                        <h1 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
                            Gérez votre entreprise en toute <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">simplicité</span>.
                        </h1>
                        <p className="text-slate-400 text-base leading-relaxed">
                            Une suite intégrée de modules pour les ventes, achats, comptabilité et stocks. Suivez vos indicateurs clés en temps réel.
                        </p>
                        
                        <div className="flex items-center space-x-4 pt-4">
                            <div className="flex -space-x-2">
                                <div className="h-8 w-8 rounded-full bg-indigo-600 border border-slate-800 flex items-center justify-center text-[10px] text-white font-bold">V</div>
                                <div className="h-8 w-8 rounded-full bg-violet-600 border border-slate-800 flex items-center justify-center text-[10px] text-white font-bold">A</div>
                                <div className="h-8 w-8 rounded-full bg-emerald-600 border border-slate-800 flex items-center justify-center text-[10px] text-white font-bold">C</div>
                                <div className="h-8 w-8 rounded-full bg-amber-600 border border-slate-800 flex items-center justify-center text-[10px] text-white font-bold">S</div>
                            </div>
                            <span className="text-xs text-slate-400 font-medium">
                                Modules actifs : Ventes, Achats, Comptabilité, Stocks
                            </span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-xs text-slate-500">
                        &copy; {new Date().getFullYear()} Factoraty ERP. Tous droits réservés.
                    </div>
                </div>

                {/* Right Side: Login Form */}
                <div className="w-full p-8 sm:p-12 md:w-1/2 flex flex-col justify-center">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold tracking-tight text-white">
                            Content de vous revoir !
                        </h2>
                        <p className="mt-2 text-sm text-slate-400">
                            Connectez-vous pour accéder à votre tableau de bord.
                        </p>
                    </div>

                    {status && (
                        <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-400 backdrop-blur-md">
                            {status}
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-6">
                        {/* Email Address */}
                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                                Adresse Email
                            </label>
                            <div className="relative">
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    className={`w-full rounded-xl border ${
                                        errors.email ? 'border-red-500/50 bg-red-950/10 focus:border-red-500 focus:ring-red-500' : 'border-slate-800 bg-slate-950/40 focus:border-indigo-500 focus:ring-indigo-500'
                                    } px-4 py-3 text-sm text-white placeholder-slate-500 backdrop-blur-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-offset-transparent`}
                                    placeholder="admin@gmail.com"
                                    autoComplete="username"
                                    required
                                    autoFocus
                                    onChange={(e) => setData('email', e.target.value)}
                                />
                            </div>
                            <InputError message={errors.email} className="mt-2 text-xs text-red-400" />
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                                    Mot de passe
                                </label>
                                {canResetPassword && (
                                    <Link
                                        href={route('password.request')}
                                        className="text-xs text-indigo-400 hover:text-indigo-300 transition duration-150 hover:underline"
                                    >
                                        Mot de passe oublié ?
                                    </Link>
                                )}
                            </div>
                            <div className="relative">
                                <input
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={data.password}
                                    className={`w-full rounded-xl border ${
                                        errors.password ? 'border-red-500/50 bg-red-950/10 focus:border-red-500 focus:ring-red-500' : 'border-slate-800 bg-slate-950/40 focus:border-indigo-500 focus:ring-indigo-500'
                                    } px-4 py-3 text-sm text-white placeholder-slate-500 backdrop-blur-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-offset-transparent`}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    required
                                    onChange={(e) => setData('password', e.target.value)}
                                />
                            </div>
                            <InputError message={errors.password} className="mt-2 text-xs text-red-400" />
                        </div>

                        {/* Remember Me */}
                        <div className="flex items-center">
                            <Checkbox
                                name="remember"
                                checked={data.remember}
                                onChange={(e) =>
                                    setData(
                                        'remember',
                                        e.target.checked,
                                    )
                                }
                                className="rounded border-slate-800 bg-slate-950/40 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
                            />
                            <span className="ms-2 text-sm text-slate-400">
                                Se souvenir de moi
                            </span>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={processing}
                            className="relative flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-600 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
                        >
                            {processing ? (
                                <svg
                                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                </svg>
                            ) : null}
                            Se connecter
                        </button>
                    </form>
                    
                    <div className="mt-8 text-center text-xs text-slate-500 block md:hidden">
                        &copy; {new Date().getFullYear()} Factoraty ERP.
                    </div>
                </div>
            </div>
        </div>
    );
}
