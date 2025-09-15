import { useRef, useEffect, useState, useId } from 'react';
import BackgroundOverlayBox from './BackgroundOverlayBox';
import Typography from './Typography';
import { MdClose } from 'react-icons/md';
import Button, { Color } from './Button';
import InputEmail from './InputEmail';
import InputPassword from './InputPassword';
import WrapperButton from './WrapperButton';

interface InputFieldConfig {
    show: boolean;
    type?: string;
    placeHolder?: string;
    label?: string;
    value?: string;
}

interface OnConfirm {
    inputValue?: string;
    [key: string]: any;
}

interface ModalState {
    isOpen: boolean;
    title: string;
    subtitle?: React.ReactNode;
    showConfirmBtn?: boolean;
    isLoadingConfirmBtn?: boolean;
    confirmBtnTxt?: string | React.ReactNode;
    onConfirm?: (obj: OnConfirm) => void;
    showCancelBtn?: boolean;
    cancelBtnTxt?: string | React.ReactNode;
    onCancel: () => void;
    onClose: () => void;
    confirmBtnColor?: 'dark' | 'light' | 'danger' | 'primary';
    cancelBtnColor?: 'dark' | 'light' | 'danger' | 'primary';
    height?: 'auto' | number;
    inputField?: InputFieldConfig;
    parentZIndex?: number;
    children?: React.ReactNode;
}

export default function Modal({
    isOpen,
    title = 'Confirmation',
    subtitle,
    showConfirmBtn = true,
    isLoadingConfirmBtn,
    confirmBtnTxt = 'Confirm',
    showCancelBtn = true,
    cancelBtnTxt = 'Cancel',
    confirmBtnColor = 'danger',
    cancelBtnColor = 'light',
    height = 'auto',
    inputField = { show: false },
    parentZIndex = 999,
    onConfirm,
    onCancel,
    onClose,
    children,
}: ModalState) {
    const modalRef = useRef<HTMLDivElement>(null);
    const inputId = useId()
    const [inputValue, setInputValue] = useState('')

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.removeProperty('overflow')
        }
        return () => {
            document.body.style.removeProperty('overflow')
        }
    }, [isOpen])

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        if (isOpen) document.addEventListener('mousedown', handleClickOutside);

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Focus input when opened if exists
    useEffect(() => {
        if (isOpen && inputField.show) {
            document.getElementById(inputId)?.focus();
        }
    }, [isOpen, inputField.show]);

    if (!isOpen) return null;

    return (
        <BackgroundOverlayBox zIndex={parentZIndex}>
            <div
                ref={modalRef}
                style={{ height }}
                className="flex flex-col items-center justify-between relative w-[360px] sm:w-[400px] md:w-[520px] lg:w-[580px] z-[100000] my-6 sm:my-8 lg:my-6 rounded-lg bg-white shadow-xl transition-all overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-center relative w-full">
                    <Typography variant="subheading" className="w-full py-2 text-center">
                        {title}
                    </Typography>
                    <WrapperButton
                        tooltipConfig={{
                            content: "Close",
                            className: 'position-left',
                            arrowClassName: 'rightside-middle'
                        }}
                        sz="lg"
                        onClick={() => onClose()}
                        className='mr-2'
                    >
                        <MdClose />
                    </WrapperButton>
                </div>

                {/* Body */}
                <div className="max-h-[70vh] lg:max-h-[60vh] p-2 overflow-y-auto custom-scrollbar-css-sm w-full">
                    {subtitle && (
                        <Typography variant="subtitle" className="pl-2">
                            {subtitle}
                        </Typography>
                    )}

                    {children}

                    {inputField.show && (
                        <div className="mt-3">
                            {inputField?.label && (
                                <label htmlFor={inputId} className="block mb-1 text-sm">
                                    {inputField.label}
                                </label>
                            )}
                            {inputField.type?.toLowerCase() === 'email' ?
                                <InputEmail
                                    id={inputId}
                                    autoFocus={true}
                                    placeholder={inputField.placeHolder || 'Email'}
                                    onInput={(val) => setInputValue(val)}
                                    sz='md'
                                    col='light'
                                />
                                :
                                inputField.type?.toLowerCase() === 'password' ?
                                    <InputPassword
                                        id={inputId}
                                        autoFocus={true}
                                        placeholder={inputField.placeHolder || 'Password'}
                                        onInput={(ev) => setInputValue(ev.currentTarget.value)}
                                        sz='md'
                                        col='light'
                                    />
                                    :
                                    <input
                                        id={inputId}
                                        autoFocus={true}
                                        placeholder={inputField.placeHolder || '...'}
                                        type={inputField.type || 'text'}
                                        onChange={(ev) => setInputValue(ev.target.value)}
                                        className='input-base input-md input-light rounded-md'
                                    />
                            }
                        </div>
                    )}
                </div>

                {/* Footer */}
                {(showConfirmBtn || showCancelBtn) && (
                    <div className="flex flex-col sm:flex-row-reverse gap-x-2 py-2 w-full items-center justify-between px-1 sm:px-2 md:px-3 lg:px-5">
                        {showConfirmBtn && (
                            <Button
                                col={confirmBtnColor as Color}
                                onClick={() => onConfirm?.({ inputValue })}
                                isLoading={!!isLoadingConfirmBtn}
                            >
                                {confirmBtnTxt}
                            </Button>
                        )}
                        {showCancelBtn && (
                            <Button
                                col={cancelBtnColor as Color}
                                onClick={() => onCancel()}
                            >
                                {cancelBtnTxt}
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </BackgroundOverlayBox>
    );
};