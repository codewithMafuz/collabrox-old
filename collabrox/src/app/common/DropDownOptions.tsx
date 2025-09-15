import React, { useState } from 'react';

type DropdownOption = {
    label: string;
    value: string | number;
};

type DropdownProps = {
    options: DropdownOption[];
    defaultValue?: string | number;
    onChange?: (value: string | number) => void;
    sz?: 'sm' | 'md' | 'lg';
    col?: 'dark' | 'light' | 'primary';
    className?: string;
    rounded?: 'sharp' | 'small' | 'half' | 'full';
};

const Dropdown = ({
    options,
    defaultValue,
    onChange,
    sz = 'md',
    col = 'dark',
    rounded = 'half',
    className = ''
}: DropdownProps) => {
    const [selected, setSelected] = useState<string | number | undefined>(defaultValue);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setSelected(value);
        onChange?.(value);
    };

    return (
        <select
            className={`dropdown dropdown-${sz} dropdown-${col} rounded-${rounded} ${className}`}
            value={selected}
            onChange={handleChange}
        >
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    );
};

export default Dropdown;