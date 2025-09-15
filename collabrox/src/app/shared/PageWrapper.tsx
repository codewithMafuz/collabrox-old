import { HTMLAttributes } from "react";

interface PageWrapperProps extends HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    ref?: React.LegacyRef<HTMLDivElement>,
}

const PageWrapper = ({ children, className = '', ...props }: PageWrapperProps) => {
    return (
        <div {...props} className={'bg-transparent ' + className}>
            {children}
        </div>
    )
}


export default PageWrapper