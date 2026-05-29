import { LabelHTMLAttributes } from 'react';

export default function InputLabel({
    value,
    className = '',
    children,
    ...props
}: LabelHTMLAttributes<HTMLLabelElement> & { value?: string }) {
    return (
        <label
            {...props}
            className={
                `block text-xs font-bold text-slate-750 dark:text-slate-350 uppercase tracking-wider mb-2 ` +
                className
            }
        >
            {value ? value : children}
        </label>
    );
}
