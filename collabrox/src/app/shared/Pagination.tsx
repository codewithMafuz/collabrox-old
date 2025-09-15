
type PaginationProps = {
    currentPage: number;
    totalPages: number;
    onClick: (page : number) => void;
}

const Pagination = ({ currentPage, totalPages, onClick }: PaginationProps) => {
    const firstTwoPages = [1, 2];
    const lastTwoPages = [totalPages - 1, totalPages];
    const previousTwoPages = [currentPage - 2, currentPage - 1].filter(page => page > 0);
    const nextTwoPages = [currentPage + 1, currentPage + 2].filter(page => page <= totalPages);

    const pagesToRender = Array.from(new Set([...firstTwoPages, ...previousTwoPages, currentPage, ...nextTwoPages, ...lastTwoPages])).filter(page => page > 0 && page <= totalPages);


    pagesToRender.sort((a, b) => a - b);

    return (
        <div className="pagination flex items-center justify-center gap-2 md:gap-3 py-1">
            {(pagesToRender.length > 0 ? pagesToRender : [1]).map((page, index) => {
                const showBreak = index > 0 && pagesToRender[index - 1] !== page - 1;

                return (
                    <div key={Math.random()}>
                        {showBreak && <span>...</span>}
                        <button
                            onClick={() => onClick(page)}
                            className={`px-2 ${page === currentPage ? 'bg-gray-700 text-white' : 'bg-gray-200 text-black'} rounded-sm`}
                        >
                            {page}
                        </button>
                    </div>
                );
            })}
        </div>
    );
}


export default Pagination