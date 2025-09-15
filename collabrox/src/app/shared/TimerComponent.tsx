import { useState, useEffect, Fragment, useRef } from 'react';
/**
 * @param start The count timer in seconds, a integer number from which count dicrease to 0
 * @param onEndTime a function that will run instantly after timer reach to 0
 * @param prefix any prefix that will needed to add before (time+s and time+m)
 * @param endTxt a text that will be side of the time after ending of counting timer
 * @returns a React.node only texts accoding to params
 */

const TimerComponent = ({
    onEndTime = () => { },
    onSecondChange = () => { },
    start = 5,
    prefix = '',
    endTxt = null
}: {
    onEndTime?: Function,
    onSecondChange?: (second: number) => void,
    start?: number,
    prefix?: string,
    endTxt?: string | null
}
) => {
    const [seconds, setSeconds] = useState<any>(start);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        setSeconds(start)
    }, [start])

    useEffect(() => {
        intervalRef.current = setInterval(() => {
            const newSecond = seconds - 1
            setSeconds(newSecond);
            onSecondChange(newSecond)
        }, 1000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
    }, [seconds]);

    useEffect(() => {
        if (seconds <= 0) {
            setSeconds(false)
            if (intervalRef.current) clearInterval(intervalRef.current);
            onEndTime();
        }
    }, [seconds]);

    return (
        <Fragment>{seconds ? prefix : ''}{`${Math.floor(seconds / 60)}m ${seconds % 60}s`}{!seconds ? endTxt : ''}</Fragment>
    );
};

export default TimerComponent;
