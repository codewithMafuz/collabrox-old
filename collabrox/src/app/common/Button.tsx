import React, { memo } from 'react';
import Tooltip, { type TooltipProps } from './ToolTip';
import { classNames } from '../../lib/StringUtils';
import Spinner from './Spinner';
import useThrottling from '../../hooks/useThrottle';

export type Size = 'sm' | 'md' | 'lg';
export type Color = 'dark' | 'light' | 'primary' | 'danger' | 'success';
export type Rounded = 'sharp' | 'small' | 'half' | 'full';

const FIXED_WIDTH_HEIGHT = {
    sm: 'p-0 w-[60px] h-[16px]',
    md: 'p-0 w-[100px] h-[20px]',
    lg: 'p-0 w-[180px] h-[22px]',
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    children: string | React.ReactNode;
    tooltipProps?: TooltipProps;
    col?: Color;
    sz?: Size;
    rounded?: Rounded;
    widthHeight?: Size;
    className?: string;
    requiredOnline?: boolean;
    throttledLimitMs?: number;
    ref?: React.Ref<HTMLButtonElement>;
    icon?: React.ReactNode;
    loaderIcon?: React.ReactNode;
    isLoading?: boolean;
    loadingAnimation?: 'spinner' | 'animate';
    childrenOnLoading?: string | React.ReactNode;
};

const Button = ({
    tooltipProps = {},
    col = 'primary',
    sz = 'md',
    rounded = 'full',
    widthHeight,
    className = '',
    disabled = false,
    children = 'Button',
    requiredOnline = false,
    throttledLimitMs,
    onClick,
    ref,
    icon = null,
    loaderIcon = <Spinner />,
    isLoading = false,
    loadingAnimation = 'spinner',
    childrenOnLoading,
    ...props
}: ButtonProps) => {
    const isOnline = requiredOnline ? navigator.onLine : true;

    const throttledOnClick = throttledLimitMs && typeof throttledLimitMs === 'number' && onClick ?
        useThrottling(onClick, throttledLimitMs)
        :
        onClick;

    const combinedClassName = classNames(
        `flex gap-x-1 btn btn-${sz} btn-${col} btn-rounded-${rounded}`,
        widthHeight && FIXED_WIDTH_HEIGHT[widthHeight],
        !isLoading && !disabled && isOnline ? 'ripple-primary transition-all cursor-pointer shadow-sm' : 'cursor-auto opacity-50',
        className
    );

    return (
        <Tooltip {...tooltipProps}>
            <button
                tabIndex={-1}
                ref={ref}
                className={combinedClassName}
                disabled={isLoading || disabled}
                onClick={throttledOnClick}
                {...props}
            >
                {isLoading ? loaderIcon : icon}
                <span>{isLoading ? childrenOnLoading || children : children}</span>
            </button>
        </Tooltip>
    );
};

export default memo(Button);



export type SimpleButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    children: string | React.ReactNode;
    col?: Color;
    sz?: Size;
    rounded?: Rounded;
    widthHeight?: Size;
    className?: string;
    icon?: React.ReactNode;
};


export const SimpleButton = ({
    col = 'primary',
    sz = 'md',
    rounded = 'full',
    widthHeight,
    className = '',
    disabled = false,
    children = 'Button',
    onClick,
    icon = null,
    ...props
}: ButtonProps) => {
    const combinedClassName = classNames(
        `flex gap-x-1 btn btn-${sz} btn-${col} btn-rounded-${rounded}`,
        widthHeight && FIXED_WIDTH_HEIGHT[widthHeight],
        !disabled ? 'ripple-primary transition-all cursor-pointer shadow-sm' : 'cursor-auto opacity-50',
        className
    );

    return (
        <button
            tabIndex={-1}
            className={combinedClassName}
            disabled={disabled}
            onClick={onClick}
            {...props}
        >
            {icon}
            <span>{children}</span>
        </button>
    );
};