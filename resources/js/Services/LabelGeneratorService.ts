export class LabelGeneratorService {
    /**
     * Generate an automatic label based on the journal nature code and the account name/description.
     */
    static generate(natureCode: string | undefined, accountLibelle: string): string {
        if (!accountLibelle) return '';
        
        // Clean up accountLibelle if needed (e.g. trim whitespace)
        const cleanLibelle = accountLibelle.trim();
        
        switch (natureCode?.toUpperCase()) {
            case 'TRS':
                return `Règlement ${cleanLibelle}`;
            case 'ACH':
                return `Achat ${cleanLibelle}`;
            case 'VTE':
                return `Vente ${cleanLibelle}`;
            case 'IMM':
                return `Immo ${cleanLibelle}`;
            case 'NDF':
                return `Note de frais ${cleanLibelle}`;
            default:
                return cleanLibelle;
        }
    }
}
