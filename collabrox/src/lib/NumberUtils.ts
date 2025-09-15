
type TimeFrame = 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second'

const TimeFramesToMS: Record<TimeFrame, number> = {
    year: 31536000000,
    month: 2592000000,
    week: 604800000,
    day: 86400000,
    hour: 3600000,
    minute: 60000,
    second: 1000
}

// Checks if the difference between two timestamps is greater than or equal to a specified value
const isPassedDifference = (
    earlierDate: number,
    laterDate: number,
    difference: number | [number, TimeFrame]
): boolean =>
    laterDate - earlierDate >= (
        typeof difference === "number"
            ?
            difference
            :
            difference[0] * TimeFramesToMS[difference[1]]
    );


const getTimeAgoFromCurrent = (milliSeconds: number): string => {
    const diff = Date.now() - milliSeconds;

    for (const timeFrame in TimeFramesToMS) {
        const elapsed = Math.floor(diff / TimeFramesToMS[timeFrame as TimeFrame]);
        if (elapsed > 0) return `${elapsed} ${timeFrame}${elapsed > 1 ? 's' : ''} ago`;
    }

    return 'Just now';
};

const generateRandomNumber = () => {
    Math.floor(Math.random() * 90000000) + 10000000;
}


export type ItemOf<T extends readonly any[]> = T[number];

const units = ['M', 'H', 'D', 'W', 'Y'] as const;
export type Unit = ItemOf<typeof units>;

const UnitMS: Record<Unit, number> = { M: 6e4, H: 36e5, D: 864e5, W: 6048e5, Y: 31536e6 };
export type UnitStr = `${number}${Unit}`;

const fromMSstr = (ms: number): string => {
    for (const u of units) {
        const v = ms / UnitMS[u];
        if (v >= 1) return `${Math.round(v)}${u}`;
    }
    return `${ms}ms`;
};

const toMS = (input: UnitStr) => parseFloat(input.slice(0, -1)) * UnitMS[input.slice(-1) as Unit];





export {
    isPassedDifference,
    getTimeAgoFromCurrent,
    generateRandomNumber,
    fromMSstr,
    toMS,
}