import { forwardRef, useMemo, useState } from "react";
import type { ImgHTMLAttributes } from "react";
import { classNames } from "../../lib/StringUtils";
import { getFullFirebaseImageURL } from "../../lib/ServerUitls";

interface ImageBoxProps extends ImgHTMLAttributes<HTMLImageElement> {
    imgSrc: string | undefined;
    alt?: string;
    width?: string;
    height?: string;
    className?: string;
    loading?: "lazy" | "eager";
    onClick?: (ev: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

const ImageBox = forwardRef<HTMLDivElement, ImageBoxProps>(({
    imgSrc,
    alt = 'something',
    width = '40px',
    height = '40px',
    className = 'rounded-full',
    loading = 'lazy',
    onClick,
    ...imgProps
}, ref) => {
    const [loaded, setLoaded] = useState(false);
    const src = useMemo(() =>
        imgSrc?.includes('token=') ?
            getFullFirebaseImageURL(imgSrc) // firebase image src will include 'token='
            :
            imgSrc,
        [imgSrc])

    return (
        <div
            ref={ref}
            onClick={onClick}
            style={{ ...imgProps.style, width, height }}
            className={classNames(
                "overflow-hidden cursor-pointer",
                className
            )}
        >
            {src ? (
                <img
                    {...imgProps}
                    src={src}
                    alt={alt}
                    loading={loading}
                    style={{
                        width,
                        height,
                        opacity: loaded ? 1 : 0,
                        transition: 'opacity 0.3s ease-in-out',
                        ...imgProps.style,
                    }}
                    className="object-cover"
                    onLoad={() => setLoaded(true)}
                    draggable={false}
                />
            ) : (
                <div
                    style={{ width, height }}
                    className={`bg-light-300 dark:bg-light-400 ${!loaded && src ? 'animate-pulse' : ''}`}
                />
            )}
        </div>
    );
});

export default ImageBox;