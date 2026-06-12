export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
}

export interface Entity {
    id: number;
    code: string | null;
    label: string;
    devise_id: number | null;
    default_tva: number;
    number_after_comma: number;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
    entity?: Entity | null;
};
