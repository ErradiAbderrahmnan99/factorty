import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface Employee {
    id?: number;
    first_name: string;
    last_name: string;
    tele: string;
    email: string;
    adress: string;
    cin: string;
    birth_date: string;
    gender: string;
}

export default function UpdateEmployeeInformation({
    employee,
    className = '',
}: {
    employee: Employee | null;
    className?: string;
}) {
    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            first_name: employee?.first_name || '',
            last_name: employee?.last_name || '',
            tele: employee?.tele || '',
            email: employee?.email || '',
            adress: employee?.adress || '',
            cin: employee?.cin || '',
            birth_date: employee?.birth_date || '',
            gender: employee?.gender || '',
        });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        patch(route('profile.employee.update'));
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                    Informations Professionnelles (Employé)
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Mettez à jour les informations professionnelles de votre fiche employé.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                        <InputLabel htmlFor="first_name" value="Prénom" />
                        <TextInput
                            id="first_name"
                            className="mt-1 block w-full"
                            value={data.first_name}
                            onChange={(e) => setData('first_name', e.target.value)}
                            required
                            autoComplete="given-name"
                        />
                        <InputError className="mt-2" message={errors.first_name} />
                    </div>

                    <div>
                        <InputLabel htmlFor="last_name" value="Nom de Famille" />
                        <TextInput
                            id="last_name"
                            className="mt-1 block w-full"
                            value={data.last_name}
                            onChange={(e) => setData('last_name', e.target.value)}
                            required
                            autoComplete="family-name"
                        />
                        <InputError className="mt-2" message={errors.last_name} />
                    </div>

                    <div>
                        <InputLabel htmlFor="tele" value="Téléphone" />
                        <TextInput
                            id="tele"
                            type="tel"
                            className="mt-1 block w-full"
                            value={data.tele}
                            onChange={(e) => setData('tele', e.target.value)}
                            autoComplete="tel"
                        />
                        <InputError className="mt-2" message={errors.tele} />
                    </div>

                    <div>
                        <InputLabel htmlFor="employee_email" value="Adresse Email Professionnelle" />
                        <TextInput
                            id="employee_email"
                            type="email"
                            className="mt-1 block w-full"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            autoComplete="email"
                        />
                        <InputError className="mt-2" message={errors.email} />
                    </div>

                    <div>
                        <InputLabel htmlFor="cin" value="N° CIN / Passeport" />
                        <TextInput
                            id="cin"
                            className="mt-1 block w-full"
                            value={data.cin}
                            onChange={(e) => setData('cin', e.target.value)}
                        />
                        <InputError className="mt-2" message={errors.cin} />
                    </div>

                    <div>
                        <InputLabel htmlFor="birth_date" value="Date de Naissance" />
                        <TextInput
                            id="birth_date"
                            type="date"
                            className="mt-1 block w-full"
                            value={data.birth_date}
                            onChange={(e) => setData('birth_date', e.target.value)}
                        />
                        <InputError className="mt-2" message={errors.birth_date} />
                    </div>

                    <div>
                        <InputLabel htmlFor="gender" value="Genre" />
                        <select
                            id="gender"
                            className="mt-1 block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-xs text-slate-800 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200 h-10 px-3"
                            value={data.gender}
                            onChange={(e) => setData('gender', e.target.value)}
                        >
                            <option value="">Sélectionnez le genre</option>
                            <option value="Male">Homme</option>
                            <option value="Female">Femme</option>
                        </select>
                        <InputError className="mt-2" message={errors.gender} />
                    </div>
                </div>

                <div>
                    <InputLabel htmlFor="adress" value="Adresse Résidence" />
                    <textarea
                        id="adress"
                        className="mt-1 block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-xs text-slate-800 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200 p-3 min-h-[80px]"
                        value={data.adress}
                        onChange={(e) => setData('adress', e.target.value)}
                    />
                    <InputError className="mt-2" message={errors.adress} />
                </div>

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>Enregistrer</PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-slate-550 dark:text-slate-400">
                            Enregistré avec succès.
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
