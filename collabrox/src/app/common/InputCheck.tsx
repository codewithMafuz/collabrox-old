import React from 'react';

type CheckSize = 'sm' | 'md' | 'lg';
type CheckColor = 'primary' | 'danger' | 'success' | 'dark' | 'light';
type CheckRounded = 'sharp' | 'small' | 'half' | 'full';

interface InputCheckProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
    parentClassName?: string;
    id: string;
    sz?: CheckSize;
    col?: CheckColor;
    rounded?: CheckRounded;
    label?: React.ReactNode;
}

const InputCheck = React.forwardRef<HTMLInputElement, InputCheckProps>(({
    parentClassName = '',
    id,
    sz = 'md',
    col = 'primary',
    rounded = 'small',
    label,
    disabled,
    ...props
}, ref) => {

    return (
        <div className={`inline-flex items-center gap-1.5 input-check-container-${sz} ${parentClassName}`}>
            <input
                ref={ref}
                type="checkbox"
                className={`checkbox-base input-check input-check-${sz} input-check-${col} input-check-rounded-${rounded}`}
                id={id}
                disabled={disabled}
                {...props}
            />
            {label && (
                <label
                    htmlFor={id}
                    className={`select-none text-[--color-text-base] ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                >
                    {label}
                </label>
            )}
        </div>
    );
});

export default InputCheck;