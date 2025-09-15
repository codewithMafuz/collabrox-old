import { ForwardedRef, forwardRef, useState } from "react";
import { MdOutlineSearch } from "react-icons/md";

interface SearchInputProps extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'onChange' | 'onFocus' | 'onBlur' | 'onInput' | 'value' | 'className'
> {
    onChange?: ({ event, sanitizedVal }: {
        event?: React.ChangeEvent<HTMLInputElement>,
        sanitizedVal?: string
    }) => void;
    onFocus?: ({ event, value }: {
        event?: React.ChangeEvent<HTMLInputElement>,
        value?: string
    }) => void;
    onInput?: (event?: React.FormEvent<HTMLInputElement>) => void;
    onBlur?: ({ event, value }: {
        event?: React.ChangeEvent<HTMLInputElement>,
        value?: string
    }) => void;
    className?: string;
    initialValue?: string;
    htmlFor?: string;
    iconClassName?: string;
    inputClassName?: string;
}

export const SearchInput = forwardRef((
    {
        onChange,
        onFocus,
        onInput,
        onBlur,
        className = "w-full h-full flex items-center justify-center",
        placeholder = 'Search',
        initialValue = '',
        htmlFor = 'search',
        iconClassName = "",
        inputClassName = "px-2 pl-[26px] py-[2px] rounded-[20px] focus:border-none focus:outline-none w-full text-[1.1rem]",
        maxLength = 200,
        ...inputProps  // Capturing remaining input attributes
    }: SearchInputProps,
    ref: ForwardedRef<HTMLInputElement>
) => {
    const [value, setValue] = useState<string>(initialValue);

    return (
        <label
            htmlFor={htmlFor}
            className={className}
        >
            <MdOutlineSearch className={`text-[1.2rem] text-gray-900 ${iconClassName}`} />
            <input
                {...inputProps}  // Spread additional input attributes
                ref={ref}
                name={htmlFor}
                type="search"
                placeholder={placeholder}
                value={value}
                onChange={(event) => {
                    const sanitizedVal = event.target.value.replace(/  +/g, ' ');
                    if (maxLength && sanitizedVal.length > maxLength) return;
                    setValue(sanitizedVal);
                    onChange?.({ event, sanitizedVal });
                }}
                onInput={onInput}
                className={inputClassName}
                onFocus={(event) => onFocus?.({ event, value })}
                onBlur={(event) => onBlur?.({ event, value })}
                maxLength={maxLength}
            />
        </label>
    );
});