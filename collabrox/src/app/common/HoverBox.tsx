import React, { useRef, useState } from 'react'

type HoverBoxProps = React.HtmlHTMLAttributes<HTMLDivElement> & {
    children: React.ReactNode;
}

export default function HoverBox({
    // children,
    ...props
}) {

    const hoverContainer = useRef<HTMLDivElement>(null)
    const displayContainer = useRef<HTMLDivElement>(null)

    const [isLoading, setIsLoading] = useState<boolean>(true)


    return (
        <div>
            <div
                onMouseOver={() => {

                }}
                ref={hoverContainer}>
                {/* {children} */}
            </div>
            <div
                className='h-auto max-h-[60vh]'
                ref={displayContainer}>
                {/* {initialContent} */}
                
            </div>
        </div>
    )
}


