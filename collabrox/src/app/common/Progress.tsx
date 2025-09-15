import Typography from "./Typography";

export default function Progress({ progress, stage }: { progress?: number; stage?: string }) {
    return (
        <div className="w-full flex flex-col items-center py-2">
            <div className="w-full flex justify-between text-xs text-gray-600 mb-1">
                <Typography variant="p" className="font-medium">{stage || 'Processing'}</Typography>
                <Typography variant="p">{progress !== undefined ? `${progress}%` : '...'}</Typography>
            </div>

            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-primary-lighter to-primary-darker transition-all duration-300 ease-out"
                    style={{ width: `${progress || 0}%` }}
                />
            </div>
        </div>
    );
};