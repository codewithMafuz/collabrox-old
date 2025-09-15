import { AnchorHTMLAttributes } from 'react';
import { useNavigateCustom } from '../../hooks/useNavigateCustom';


interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
    children: React.ReactNode;
    to: string;
    replace?: boolean;
    disabled?: boolean;
    onClickLink?: () => void;
    onDisableClick?: () => void;
    className?: string;
    checkSearchToo?: boolean;
    state?: any;
    sz?: 'xs' | 'sm' | 'md' | 'lg';
    col?: 'dark' | 'primary' | 'danger' | 'success';
}

const Link = ({
    children,
    to,
    replace = false,
    disabled = false,
    onClickLink,
    onDisableClick,
    col = 'primary',
    sz = 'sm',
    className = '',
    checkSearchToo = false,
    state,
    ...props
}: LinkProps) => {
    const navigate = useNavigateCustom();

    const handleClick = (ev: React.MouseEvent<HTMLAnchorElement>) => {
        if (onClickLink) onClickLink();
        if (!to) return ev.preventDefault();

        if (ev.ctrlKey || ev.metaKey) return; // Allow open in new tab

        if (!to.startsWith('http')) {
            ev.preventDefault();
            if (!disabled) {
                navigate({ url: to, checkSearchToo, replace, state });
            } else {
                onDisableClick?.();
            }
        }
    };


    return (
        <a
            href={to}
            className={`link link-${sz} link-${col} ${disabled ? 'link-disabled' : ''} ${className}`}
            onClick={handleClick}
            {...props}
        >
            {children}
        </a>
    );
};

export default Link;





