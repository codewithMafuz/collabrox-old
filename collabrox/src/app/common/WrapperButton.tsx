import { ButtonHTMLAttributes } from "react";
import Tooltip, { TooltipProps } from "./ToolTip";

export type ButtonSize = 'ss' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ButtonColor = 'dark' | 'light' | 'primary' | 'success' | 'danger';
export type ButtonRounded = 'sharp' | 'small' | 'half' | 'full';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    sz?: ButtonSize;
    col?: ButtonColor;
    rounded?: ButtonRounded;
    tooltipConfig?: TooltipProps;
    className?: string;
    focusable?: boolean;
    bgTransparent?: boolean;
};

export type TogglableButtonProps = ButtonProps & {
    onToggle?: () => void;
    initial?: boolean;
    titles?: readonly [string, string];
};

const WrapperButton = ({
    sz = "md",
    col = 'light',
    rounded = 'full',
    className = "",
    tooltipConfig,
    children,
    ...props
}: ButtonProps) => {
    return (
        <Tooltip {...tooltipConfig}>
            <button
                {...props}
                className={`
                    icon-btn icon-btn-${sz} icon-btn-${col}
                    rounded-${rounded} transition-all
                    ${props.bgTransparent ? 'bg-transparent' : ''}
                    ${props.focusable ? 'focus:ring-2' : 'focus:ring-1'}
                    ${className}
                `}
                type="button"
            >
                {children}
            </button>
        </Tooltip>
    );
};

export default WrapperButton;