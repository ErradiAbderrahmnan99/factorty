import { usePage } from '@inertiajs/react';
import { PageProps } from '@/types';

export function useEntitySettings() {
    const { entity } = usePage<PageProps>().props;

    const decimals = entity?.number_after_comma !== undefined ? Number(entity.number_after_comma) : 2;
    const defaultTva = entity?.default_tva !== undefined ? Number(entity.default_tva) : 20;
    const defaultDeviseId = entity?.devise_id ? entity.devise_id.toString() : '';

    const formatMoney = (amount: number) => {
        return amount.toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        });
    };

    const roundMoney = (amount: number): number => {
        return Number(Number(amount).toFixed(decimals));
    };

    const stepMoney = () => {
        return (1 / Math.pow(10, decimals)).toString();
    };

    return {
        decimals,
        defaultTva,
        defaultDeviseId,
        formatMoney,
        roundMoney,
        stepMoney,
    };
}
