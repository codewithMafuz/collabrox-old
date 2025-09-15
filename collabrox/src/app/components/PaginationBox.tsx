import { ReactNode, useEffect, useState } from 'react'
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";

type PaginationBoxFetcherResultType = {
    status: 'OK' | 'Failed',
    result: any,
    totalPages: number,
}

type PaginationBoxPropsTypes = {
    className?: string,
    btnClassName?: string,
    initialPage?: number,
    fetcher: (params: { page: number, [key: string]: any }) => Promise<PaginationBoxFetcherResultType>,
    children: (props: { item: any; index: number;[key: string]: any }) => ReactNode;
    passToChildren?: object;
}

function PaginationBox({
    className = 'w-full',
    btnClassName = 'flex items-center justify-center px-10 py-1 hover:bg-gray-200 transition-all',
    initialPage = 1,
    fetcher,
    children,
    passToChildren = {},

}: PaginationBoxPropsTypes) {
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [currentData, setCurrentData] = useState<any[]>([])
    const [page, setPage] = useState<number>(initialPage)
    const [allPagesNo, setAllPagesNo] = useState<number[]>([])

    const prevPagesNo = page === 2 ? [1] : page === 1 ? [] : allPagesNo.slice(page - 3, page - 1)
    const nextPagesNo = allPagesNo.slice(page, page + 2)

    const fetchAndSetData = async () => {
        try {
            setIsLoading(true)
            const { status, result, totalPages } = await fetcher({ page });
            if (status === 'OK') {
                setCurrentData(result);
                setAllPagesNo(Array.from({ length: totalPages }, (_, i) => i + 1))
            }
            setIsLoading(false)
        } catch (error) {
            setIsLoading(false)
            console.error("Error in fetchAndSetData of PaginationBox:", error);
        }
    };

    useEffect(() => {
        fetchAndSetData()
    }, [page])

    return (
        <div className={className}>
            {currentData.map((item, index) => children({ item, index, ...passToChildren }))}
            <div className="h-auto w-full my-2 mt-[30px] flex items-center justify-between px-[15%]">
                <button
                    title='Previous page'
                    onClick={() => setPage(prev => prev - 1)}
                    className={btnClassName}
                    disabled={page === 1 || isLoading}
                >
                    <MdKeyboardArrowLeft className='text-[1.3rem] text-black font-bold' />
                </button>
                <div className="flex items-center justify-center gap-[5px]">
                    {prevPagesNo.map((pageNo) =>
                        <button onClick={() => setPage(pageNo)} key={pageNo}>{pageNo}</button>
                    )}
                    {prevPagesNo.length === 0 && nextPagesNo.length === 0 &&
                        <button
                            onClick={() => {
                                if (!isLoading) {
                                    fetchAndSetData()
                                }
                            }}
                            disabled={isLoading}>{page}</button>
                    }
                    {nextPagesNo.map((pageNo) =>
                        <button onClick={() => setPage(pageNo)} key={pageNo}>{pageNo}</button>
                    )}
                </div>
                <button
                    title='Next page'
                    onClick={() => setPage(prev => prev + 1)}
                    className={btnClassName}
                    disabled={nextPagesNo.length === 0 || isLoading}
                >
                    <MdKeyboardArrowRight className='text-[1.3rem] text-black font-bold' />
                </button>
            </div>
        </div>
    )
}

export default PaginationBox;
