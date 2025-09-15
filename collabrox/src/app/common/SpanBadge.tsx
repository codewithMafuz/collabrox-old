import React from 'react';

type SpanBadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
    sz?: 'sm' | 'md' | 'lg';
    col?: 'dark' | 'primary' | 'danger' | 'success' | 'light';
    rounded?: 'sharp' | 'small' | 'half' | 'full';
    className?: string;
};

const SpanBadge = ({
    col = 'primary',
    sz = 'md',
    rounded = 'full',
    className = '',
    children,
    ...props
}: SpanBadgeProps) => {
    return (
        <span
            className={`badge badge-${sz} badge-${col} badge-rounded-${rounded} ${className}`}
            {...props}
        >
            {children}
        </span>
    );
};

export default SpanBadge;