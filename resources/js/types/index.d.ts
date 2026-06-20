export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
}

export interface TauxTva {
    id: number;
    code: string;
    libelle: string;
    taux: number;
    actif: boolean;
}

export interface Entity {
    id: number;
    code: string | null;
    label: string;
    devise_id: number | null;
    default_tva_id: number | null;
    number_after_comma: number;
    default_taux_tva?: TauxTva | null;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
    entity?: Entity | null;
};
