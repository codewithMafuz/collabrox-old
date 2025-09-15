import { useRef, useState } from "react"
import { MdFilterList, MdOutlineCheck } from "react-icons/md"
import Typography from "../common/Typography"
import CusotmHr from "../common/CustomHr"

const FilteringButtons = ({
    buttonNames,
    onClick,
    className = '',
    listingBoxClassName = '',
}: {
    buttonNames: string[],
    onClick?: (btnName?: string, activeBtnNames?: string[]) => void,
    className?: string,
    listingBoxClassName?: string
}) => {
    const [show, setShow] = useState<boolean>(false)
    const activeBtnNames = useRef<string[]>([])

    return (
        <div className="relative flex flex-col space-y-2">
            <button
                className={`text-gray-900 bg-gray-100 hover:bg-gray-200 px-2 h-[30px] rounded-full flex justify-center items-center gap-1 font-[500]${className ? ' ' + className : ''} ${show ? "outline outline-[1px] outline-gray-500" : ""}`}
                onClick={() => setShow(prev => !prev)}
            >
                <span>Filter</span>
                <MdFilterList />
            </button>
            <div
                className={`absolute top-[30px] right-0 w-[220px] p-2 bg-white border border-gray-100 rounded-md shadow-lg flex-col${listingBoxClassName ? ' ' + listingBoxClassName : ''} ${show ? 'flex' : 'hidden'}`}
            >
                <Typography variant="p">Sort by</Typography>
                <CusotmHr variant="thin" />
                <div className="flex flex-col gap-1 items-center w-full text-[.9rem]">
                    {buttonNames.map((btnName) => {
                        const isActive = activeBtnNames.current.includes(btnName)
                        return <button
                            key={btnName}
                            onClick={() => {
                                activeBtnNames.current = isActive ? activeBtnNames.current.filter(n => n !== btnName) : [...activeBtnNames.current, btnName]
                                onClick?.(btnName, activeBtnNames.current)
                            }}
                            className={`px-3 py-1 rounded-lg w-full flex itmes-center justify-start gap-1 font-semibold ${isActive
                                ? "bg-indigo-100"
                                : "hover:bg-gray-100"
                                }`}
                        >
                            {isActive ?
                                <MdOutlineCheck className="min-w-[40px] text-[1rem] text-indigo-600" />
                                :
                                <span className="min-w-[40px]"></span>
                            }
                            <span>{btnName}</span>
                        </button>
                    })}
                </div>
            </div>
        </div>
    )
}


export default FilteringButtons