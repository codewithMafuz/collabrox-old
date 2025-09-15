import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { MdSearch, MdKeyboardArrowRight } from 'react-icons/md';

interface AutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    onSelect: (selectedItem: any[]) => void;
    suggestions: any[][];
    placeholder?: string;
    className?: string;
    autoFocus?: boolean;
}

const Autocomplete = ({
    value,
    onChange,
    onSelect,
    suggestions,
    placeholder,
    className = '',
    autoFocus = true,
}: AutocompleteProps) => {
    const [isFocused, setIsFocused] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setFocusedIndex(-1);
    }, [suggestions]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setFocusedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setFocusedIndex(prev => Math.max(prev - 1, -1));
                    break;
                case 'Enter':
                    if (focusedIndex >= 0 && focusedIndex < suggestions.length) {
                        onSelect(suggestions[focusedIndex]);
                        setIsFocused(false);
                    }
                    break;
                case 'Escape':
                    setIsFocused(false);
                    break;
            }
        };

        const inputEl = inputRef.current;
        if (inputEl) {
            inputEl.addEventListener('keydown', handleKeyDown as unknown as EventListener);
            return () => inputEl.removeEventListener('keydown', handleKeyDown as unknown as EventListener);
        }
    }, [focusedIndex, suggestions, onSelect]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            <div className="flex items-center relative">
                <MdSearch className="absolute left-3 text-gray-400" size={20} />
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(ev) => {
                        setIsFocused(true)
                        onChange(ev.target.value)
                    }}
                    onFocus={() => setIsFocused(true)}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all"
                    aria-autocomplete="list"
                    autoFocus={autoFocus}
                />
            </div>

            {isFocused && suggestions.length > 0 && (
                <div
                    className="absolute mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-100 z-50"
                    role="listbox"
                >
                    {suggestions.map((item, index) => {
                        return (
                            <button
                                key={index}
                                onClick={() => {
                                    onSelect(item);
                                    setIsFocused(false);
                                }}
                                onMouseEnter={() => setFocusedIndex(index)}
                                className={`w-full px-4 py-3 flex items-center justify-between transition-colors first:rounded-t-lg last:rounded-b-lg ${index === focusedIndex ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                                role="option"
                                aria-selected={index === focusedIndex}
                            >
                                <div className="text-left">
                                    <p className="text-gray-900 font-medium">{item[0]}</p>
                                    {item[1] && (
                                        <p className="text-gray-500 text-sm mt-1">{item[1]}</p>
                                    )}
                                </div>
                                <MdKeyboardArrowRight className="text-gray-400 text-lg" />
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    );
};

export default Autocomplete