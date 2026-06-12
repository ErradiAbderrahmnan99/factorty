import React, { useState, useEffect, useRef } from 'react';

interface DecimalInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
    value: number;
    onChange: (val: number) => void;
    decimals: number;
}

export default function DecimalInput({ value, onChange, decimals, className = '', ...props }: DecimalInputProps) {
    const [displayValue, setDisplayValue] = useState<string>(() => {
        return value.toFixed(decimals);
    });
    const lastValueRef = useRef<number>(value);

    // Sync with external changes
    useEffect(() => {
        if (value !== lastValueRef.current) {
            setDisplayValue(value.toFixed(decimals));
            lastValueRef.current = value;
        }
    }, [value, decimals]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value;
        
        // Clean characters: allow only digits and separators
        val = val.replace(/[^0-9.,]/g, '');
        
        // Handle multiple separators
        const firstSeparatorIdx = val.search(/[.,]/);
        if (firstSeparatorIdx !== -1) {
            const before = val.substring(0, firstSeparatorIdx);
            let after = val.substring(firstSeparatorIdx + 1).replace(/[.,]/g, '');
            after = after.substring(0, decimals);
            val = before + val[firstSeparatorIdx] + after;
        }

        setDisplayValue(val);
        
        const parsed = parseFloat(val.replace(',', '.'));
        const nextVal = isNaN(parsed) ? 0 : parsed;
        lastValueRef.current = nextVal;
        onChange(nextVal);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        setDisplayValue(value.toFixed(decimals));
        if (props.onBlur) {
            props.onBlur(e);
        }
    };

    return (
        <input
            type="text"
            inputMode="decimal"
            value={displayValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            className={className}
            {...props}
        />
    );
}
