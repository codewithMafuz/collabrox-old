import { useState, useEffect, useRef } from 'react';

interface ShowMoreTextProps {
    textHTML: string;
    className?: string;
    lines?: number;
}

const ShowMoreText = ({ textHTML, className, lines = 3 }: ShowMoreTextProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [hasOverflow, setHasOverflow] = useState(false);
    const [buttonWidth, setButtonWidth] = useState(0);
    const contentRef = useRef<HTMLDivElement>(null);
    const btnRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const checkOverflow = () => {
            if (contentRef.current) {
                const element = contentRef.current;

                // Measure heights
                element.style.webkitLineClamp = 'unset';
                const naturalHeight = element.scrollHeight;
                element.style.webkitLineClamp = lines.toString();
                const clampedHeight = element.clientHeight;

                setHasOverflow(!isExpanded && naturalHeight > clampedHeight);
                element.style.webkitLineClamp = isExpanded ? 'unset' : lines.toString();
            }
        };

        checkOverflow();
        window.addEventListener('resize', checkOverflow);
        return () => window.removeEventListener('resize', checkOverflow);
    }, [textHTML, lines, isExpanded]);

    useEffect(() => {
        if (hasOverflow && btnRef.current) {
            // Get button width after it's rendered
            setButtonWidth(btnRef.current.getBoundingClientRect().width);
        }
    }, [hasOverflow]);

    return (
        <div className={`relative ${className}`}>
            <div
                ref={contentRef}
                className="relative break-words"
                style={{
                    display: '-webkit-box',
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: isExpanded ? 'unset' : lines,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                }}
            >
                <div dangerouslySetInnerHTML={{ __html: textHTML }} />
            </div>

            {hasOverflow && (
                <div className="absolute bottom-0 right-0 h-[24px] left-0 pointer-events-none">
                    <div
                        className="absolute inset-0 bg-gradient-to-l from-white via-white to-transparent"
                        style={{
                            width: buttonWidth + 60,
                            left : 'auto',
                        }}
                    />
                    <div
                        className="absolute right-0 bottom-0 bg-white h-full"
                        style={{ width: buttonWidth }}
                    />
                </div>
            )}

            {hasOverflow && (
                <button
                    ref={btnRef}
                    onClick={() => setIsExpanded(true)}
                    className="absolute bottom-0 right-0 font-[500] hover:underline z-10"
                >
                    ... Show more
                </button>
            )}
        </div>
    );
};

export default ShowMoreText;