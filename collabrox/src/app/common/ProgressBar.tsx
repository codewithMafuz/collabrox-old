import { useEffect, useState } from "react";

type ProgressBarProps = {
    progress: number;
    height: number | string;
}

export default function ProgressBar({ progress, height }: ProgressBarProps) {
    const [internalProgress, setInternalProgress] = useState(progress);

    useEffect(() => {
        setInternalProgress(progress);
    }, [progress]);

    return (
        <div
            style={{ height }}
            className="relative h-4 w-full rounded-full bg-transparent overflow-hidden"
        >
            {/* Progress filled part */}
            <div
                className="h-full bg-primary-base dark:bg-primary-lighter transition-all duration-500 ease-in-out"
                style={{ width: `${internalProgress}%` }}
            >
                {/* Moving overlay inside the progress */}
                <div className="absolute top-0 left-0 h-full w-full overflow-hidden">
                    <div className="h-full w-1/4 bg-white/30 animate-move-overlay" />
                </div>
            </div>
        </div>
    );
}
