export default function ListItemPersonLoaders({ count = 5 }: { count?: number }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex flex-row items-center justify-between h-[40px] w-[90%] my-1 shadow-sm border-gray-200 bg-gray-200 rounded-md px-2 animate-pulse">
                    <div className="flex items-center gap-[10px]">
                        <div className="h-[34px] w-[34px] rounded-full bg-gray-300 animate-pulse"></div>
                        <div className="w-[100px] h-[20px] rounded-full bg-gray-300 animate-pulse"></div>
                    </div>
                </div>
            ))}
        </>
    );
};