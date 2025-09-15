import { forwardRef, useMemo, useState } from "react";
import type { ImgHTMLAttributes } from "react";
import { getFullFirebaseImageURL } from "../../lib/ServerUitls";

interface ImageProps extends ImgHTMLAttributes<HTMLImageElement> {
    imgSrc: string | undefined;
    alt?: string;
    width?: string;
    height?: string;
    className?: string;
    loading?: "lazy" | "eager";
}

const Image = forwardRef<HTMLImageElement, ImageProps>(({
    imgSrc,
    alt = 'something',
    width = '40px',
    height = '40px',
    className = 'rounded-full object-cover',
    loading = 'lazy',
    ...imgProps
}, ref) => {
    const [loaded, setLoaded] = useState(false);
    const src = useMemo(() =>
        imgSrc?.includes('token=') ?
            getFullFirebaseImageURL(imgSrc) :
            imgSrc,
        [imgSrc])

    if (!src) {
        return (
            <img
                ref={ref}
                alt={alt}
                style={{ width, height }}
                className={`bg-light-300 dark:bg-light-400 ${className}`}
                draggable={false}
            />
        )
    }

    return (
        <img
            {...imgProps}
            ref={ref}
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
            className={className}
            onLoad={() => setLoaded(true)}
            draggable={false}
        />
    );
});

export default Image;