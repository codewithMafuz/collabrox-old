
import { useEffect, useRef } from "react"

export default function useThrottling<T extends (...args: any[]) => void>(func: T, limit: number = 150): (...args: Parameters<T>) => void {

    const lastCalledAt = useRef<number>(0);
    const funcRef = useRef<T>(func);
    useEffect(() => { funcRef.current = func }, [func])

    const throttler = (...args: Parameters<T>) => {
        const now = Date.now()
        if ((now - lastCalledAt.current) >= limit) {
            lastCalledAt.current = now
            funcRef.current(...args)
        }
    }

    return throttler

}

