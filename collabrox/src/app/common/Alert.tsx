import { useEffect, useState } from 'react';
import { MdClose } from 'react-icons/md';


const VARIANTS_CONFIG = {
    success: {
        colorClasses: 'bg-green-100 dark:bg-green-200 text-green-800 dark:text-green-900',
        iconColor: 'text-green-500',
        iconPath: 'M12,0A12,12,0,1,0,24,12,12.014,12.014,0,0,0,12,0Zm6.927,8.2-6.845,9.289a1.011,1.011,0,0,1-1.43.188L5.764,13.769a1,1,0,1,1,1.25-1.562l4.076,3.261,6.227-8.451A1,1,0,1,1,18.927,8.2Z',
    },
    danger: {
        colorClasses: 'bg-red-100 dark:bg-red-200 text-red-800 dark:text-red-900',
        iconColor: 'text-red-500',
        iconPath: 'M11.983,0a12.206,12.206,0,0,0-8.51,3.653A11.8,11.8,0,0,0,0,12.207,11.779,11.779,0,0,0,11.8,24h.214A12.111,12.111,0,0,0,24,11.791h0A11.766,11.766,0,0,0,11.983,0ZM10.5,16.542a1.476,1.476,0,0,1,1.449-1.53h.027a1.527,1.527,0,0,1,1.523,1.47,1.475,1.475,0,0,1-1.449,1.53h-.027A1.529,1.529,0,0,1,10.5,16.542ZM11,12.5v-6a1,1,0,0,1,2,0v6a1,1,0,1,1-2,0Z',
    },
    warning: {
        colorClasses: 'bg-amber-100 dark:bg-amber-300 text-amber-800 dark:text-amber-900',
        iconColor: 'text-amber-500',
        iconPath: 'M23.119,20,13.772,2.15h0a2,2,0,0,0-3.543,0L.881,20a2,2,0,0,0,1.772,2.928H21.347A2,2,0,0,0,23.119,20ZM11,8.423a1,1,0,0,1,2,0v6a1,1,0,1,1-2,0Zm1.05,11.51h-.028a1.528,1.528,0,0,1-1.522-1.47,1.476,1.476,0,0,1,1.448-1.53h.028A1.527,1.527,0,0,1,13.5,18.4,1.475,1.475,0,0,1,12.05,19.933Z',
    },
    info: {
        colorClasses: 'bg-blue-100 dark:bg-blue-300 text-blue-800 dark:text-blue-900',
        iconColor: 'text-blue-500',
        iconPath: 'M12,0A12,12,0,1,0,24,12,12.013,12.013,0,0,0,12,0Zm.25,5a1.5,1.5,0,1,1-1.5,1.5A1.5,1.5,0,0,1,12.25,5ZM14.5,18.5h-4a1,1,0,0,1,0-2h.75a.25.25,0,0,0,.25-.25v-4.5a.25.25,0,0,0-.25-.25H10.5a1,1,0,0,1,0-2h1a2,2,0,0,1,2,2v4.75a.25.25,0,0,0,.25.25h.75a1,1,0,1,1,0,2Z',
    },
};

export type AlertVariant = keyof typeof VARIANTS_CONFIG

interface AlertProps {
    variant?: AlertVariant;
    title: string;
    className?: string;
    closeBtn?: boolean;
    onClose?: () => void | any;
}

export const Alert = ({
    variant = 'danger',
    title,
    className = '',
    closeBtn = true,
    onClose = () => { },
}: AlertProps) => {
    const config = VARIANTS_CONFIG[variant];

    return (
        <div
            className={`${config.colorClasses} px-1 py-[3px] rounded-lg flex items-start gap-2 w-full max-w-2xl mx-auto shadow-sm animate-fadeIn ${className}`}
            role="alert"
        >
            {/* Icon */}
            <div className="mt-0.5">
                <svg
                    viewBox="0 0 24 24"
                    className={`w-[18px] h-[18px] ${config.iconColor}`}
                    aria-hidden="true"
                >
                    <path fill="currentColor" d={config.iconPath} />
                </svg>
            </div>

            {/* Content */}
            <h4 className="font-medium flex-1 text-[15px]">{title}</h4>

            {/* Close Button */}
            {closeBtn && (
                <button
                    onClick={() => {
                        onClose()
                    }}
                    className={`${config.iconColor} ripple-light p-[1px] hover:opacity-75 hover:bg-light-200 transition-[opaicty_colors]`}
                    aria-label="Dismiss alert"
                >
                    <MdClose className="w-5 h-5" />
                </button>
            )
            }
        </div >
    );
};