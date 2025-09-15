
import { useCallback, useEffect, useRef } from "react";

export default function useDebounce<T extends (...args: any) => void>(func: T, delay: number): (...args: Parameters<T>) => void {
    const timer = useRef<null | ReturnType<typeof setTimeout>>(null);
    const funcRef = useRef(func);

    useEffect(() => { funcRef.current = func }, [func]);

    const debounced = useCallback((...args: Parameters<T>) => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => {
            funcRef.current(...args);
        }, delay);
    }, [delay]);



    return debounced

}