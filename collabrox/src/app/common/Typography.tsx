import React from 'react';

type TypographyTag =
    | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
    | 'p' | 'span' | 'strong' | 'em' | 'b' | 'i' | 'u' | 'small'
    | 'mark' | 'del' | 'ins' | 'abbr' | 'code' | 'pre'
    | 'blockquote' | 'cite' | 'q' | 'time' | 'sub' | 'sup'
    | 'label' | 'legend' | 'figcaption' | 'summary'
    | 'dt' | 'dd' | 'li' | 'article' | 'section'
    | 'header' | 'footer' | 'address';

export type TypographyVariants = "heading" | "subheading" | "title" | "subtitle" | "p" | "small";

const textStyles: Record<TypographyVariants, string> = {
    heading: 'text-2xl leading-7 font-bold',
    subheading: 'text-2xl leading-7 font-bold',
    title: 'text-xl leading-6 font-semibold',
    subtitle: 'text-base leading-6 font-medium',
    p: 'text-sm leading-5 font-normal',
    small: 'text-xs leading-4 font-normal',
};

const colors = {
    dark: 'text-[--color-text-base]',
    light: 'text-[--color-text-light]',
    primary: 'text-[--color-text-primary]',
    danger: 'text-[--color-text-danger]',
    success: 'text-[--color-text-success]',
};

type TypographyProps = {
    variant?: TypographyVariants;
    color?: 'dark' | 'light' | 'primary' | 'danger' | 'success';
    className?: string;
    tag?: TypographyTag;
    children: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>;

const Equivalents: Record<TypographyVariants, TypographyTag> = {
    heading: 'h1',
    subheading: 'h2',
    title: 'h3',
    subtitle: 'h4',
    p: 'p',
    small: 'small',
};

const Typography = ({
    variant = 'p',
    color = 'dark',
    className = '',
    tag,
    children,
    ...props
}: TypographyProps) => {
    const Tag = tag || Equivalents[variant];

    return (
        <Tag
            className={`${textStyles[variant]} ${colors[color]} ${className}`}
            {...props}
        >
            {children}
        </Tag>
    );
};

export default Typography;