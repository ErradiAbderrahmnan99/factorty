import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import UpdateEmployeeInformationForm from './Partials/UpdateEmployeeInformationForm';

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

export default function Edit({
    mustVerifyEmail,
    status,
    employee,
}: PageProps<{ mustVerifyEmail: boolean; status?: string; employee: Employee | null }>) {
    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                        Profil & Fiche Employé
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                        Gérez vos informations de compte utilisateur ainsi que votre fiche professionnelle de l'ERP.
                    </p>
                </div>
            }
        >
            <Head title="Profil & Fiche Employé" />

            <div className="space-y-8 max-w-7xl mx-auto">
                {/* 1. Employee Professional Profile Section */}
                <div className="bg-white dark:bg-slate-900/40 p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800/65 shadow-sm dark:shadow-xl rounded-2xl backdrop-blur-md transition-colors duration-200">
                    <UpdateEmployeeInformationForm
                        employee={employee}
                        className="max-w-3xl"
                    />
                </div>

                {/* 2. User Account Profile Section */}
                <div className="bg-white dark:bg-slate-900/40 p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800/65 shadow-sm dark:shadow-xl rounded-2xl backdrop-blur-md transition-colors duration-200">
                    <UpdateProfileInformationForm
                        mustVerifyEmail={mustVerifyEmail}
                        status={status}
                        className="max-w-xl"
                    />
                </div>

                {/* 3. Password Security Section */}
                <div className="bg-white dark:bg-slate-900/40 p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800/65 shadow-sm dark:shadow-xl rounded-2xl backdrop-blur-md transition-colors duration-200">
                    <UpdatePasswordForm className="max-w-xl" />
                </div>

                {/* 4. Delete Account Section */}
                <div className="bg-white dark:bg-slate-900/40 p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800/65 shadow-sm dark:shadow-xl rounded-2xl backdrop-blur-md transition-colors duration-200">
                    <DeleteUserForm className="max-w-xl" />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
