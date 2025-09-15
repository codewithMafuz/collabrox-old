import React, { useRef, useState, useCallback } from 'react';
import { MdClose } from 'react-icons/md';
import './InputEmail.css';

type InputSize = 'sm' | 'md' | 'lg';
type InputColor = 'dark' | 'light' | 'primary' | 'danger' | 'success';
type InputRounded = 'sharp' | 'small' | 'half' | 'full';

const DEFAULT_DOMAIN = 'gmail.com';
const DOMAIN_SUFFIX = '@' + DEFAULT_DOMAIN;
const DISALLOWED_CHARS = new Set([' ', '!', '"', '#', '$', '%', '&', "'", '(', ')', '*', '+', ',', '/', ':', ';', '<', '=', '>', '?', '[', '\\', ']', '^', '`', '{', '|', '}', '~']);

interface InputEmailProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onInput'> {
    sz?: InputSize;
    col?: InputColor;
    rounded?: InputRounded;
    className?: string;
    onInput?: (fullEmail: string) => void;
}

const InputEmail: React.FC<InputEmailProps> = ({
    sz = 'md',
    col = 'light',
    rounded = 'full',
    className = '',
    onInput,
    ...props
}) => {
    const [inpVal, setInpVal] = useState('');
    const inpRef = useRef<HTMLInputElement>(null);

    // Using refs for values that need instant access in event handlers
    const badgeDisabled = useRef(false);
    const showingDomainBadge = useRef(true);
    const didAutofillHovered = useRef(false);

    const [showDomainBadge, setShowDomainBadge] = useState(true);

    const handleDisableDomainBadge = useCallback(() => {
        showingDomainBadge.current = false;
        badgeDisabled.current = true;
        setShowDomainBadge(false);
        onInput?.(inpVal)
    }, []);

    const handleFocus = useCallback(() => {
        if (inpRef.current && !badgeDisabled.current) {
            setInpVal(inpVal.split('@')[0]);
            showingDomainBadge.current = true;
            setShowDomainBadge(true);
        }
    }, [inpVal]);

    const handleAnimationStart = useCallback((ev: React.AnimationEvent<HTMLInputElement>) => {
        if (ev.animationName === 'onAutoFillStart') didAutofillHovered.current = true;
    }, []);

    const handleKeyDown = useCallback((ev: React.KeyboardEvent<HTMLInputElement>) => {
        if (ev.repeat && ev.key !== 'Backspace') {
            ev.preventDefault();
            return;
        }

        if (ev.key === '@') {
            badgeDisabled.current = true;
            showingDomainBadge.current = false;
            setShowDomainBadge(false);
            if (ev.currentTarget.value.includes('@')) ev.preventDefault();
        }
        else if (DISALLOWED_CHARS.has(ev.key)) {
            ev.preventDefault();
        }
    }, []);

    const processInputValue = useCallback((val: string) => {
        const hasDomain = val.includes('@');
        let fullEmail = val;

        if (hasDomain) {
            const [emailPrefix, emailDomain] = val.split('@');
            const isAutofilled = didAutofillHovered.current && emailDomain === DEFAULT_DOMAIN;

            badgeDisabled.current = !isAutofilled;
            showingDomainBadge.current = isAutofilled;
            setShowDomainBadge(isAutofilled);
            setInpVal(isAutofilled ? emailPrefix : val);
        } else {
            if (showingDomainBadge.current) fullEmail += DOMAIN_SUFFIX;
            setInpVal(val);
        }

        didAutofillHovered.current = false;
        onInput?.(fullEmail);
    }, [onInput]);

    const handleInput = useCallback((ev: React.FormEvent<HTMLInputElement>) => {
        processInputValue((ev.target as HTMLInputElement).value);
    }, [processInputValue]);

    const handleBlur = useCallback(() => {
        if (showingDomainBadge.current) {
            setInpVal(`${inpVal}${DOMAIN_SUFFIX}`);
        }
        showingDomainBadge.current = false;
        setShowDomainBadge(false);
    }, [inpVal]);

    return (
        <div className="relative w-full">
            <input
                className={`__input-email-field input-base input-${sz} input-${col} rounded-${rounded} ${className}`}
                placeholder='Email'
                {...props}

                // not allowed from props properties
                ref={inpRef}
                value={inpVal}
                formNoValidate
                required={false}
                type="email"
                title=''
                onAnimationStart={handleAnimationStart}
                onFocus={handleFocus}
                onKeyDown={handleKeyDown}
                onInput={handleInput}
                onBlur={handleBlur}
            />
            {showDomainBadge && (
                <div className="badge badge-light badge-md badge-rounded-full absolute top-1/2 -translate-y-1/2 right-1.5 flex items-center justify-center group">
                    <p>{DOMAIN_SUFFIX}</p>
                    <MdClose
                        onMouseDown={(ev) => ev.preventDefault()}
                        onClick={handleDisableDomainBadge}
                        className="ml-1 p-0.5 mt-0.5 rounded-full border transition-all cursor-pointer group-hover:bg-gray-300 group-hover:border-gray-300"
                    />
                </div>
            )}
        </div>
    );
};

export default InputEmail;