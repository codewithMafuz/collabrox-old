import { useEffect, useRef } from "react";
import lottie from "lottie-web";

const LottieAnimation = ({ animationData, className = '', style = { height: 260, width: 260 } }: { animationData: any, className?: string, style?: React.CSSProperties }) => {
    const container = useRef(null);

    useEffect(() => {
        const anim = lottie.loadAnimation({
            container: container?.current || document.createElement('div'),
            renderer: "canvas",
            loop: true,
            autoplay: true,
            animationData,
        });

        return () => anim.destroy();
    }, [animationData]);

    return <div ref={container} style={style} className={className}></div>;
};


export default LottieAnimation