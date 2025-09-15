import React, { HTMLAttributes, forwardRef } from "react";

interface ComponentWrapperProps extends HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
}

const ComponentWrapper = forwardRef<HTMLDivElement, ComponentWrapperProps>(
    ({ children, className = '', ...props }, ref) => {
        return (
            <div
                {...props}
                ref={ref}
                className={'bg-white rounded-sm lg:rounded-md ' + className}
            >
                {children}
            </div>
        );
    }
);

export default ComponentWrapper;
