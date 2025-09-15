const oneHourToMl = 60 * 60 * 1000;

const convHourToMilsec = (hours = 1) => Math.round(hours * oneHourToMl);

const generateUniqueNumber = (excludedNumbers?: number[]) => {
    if (!excludedNumbers || !excludedNumbers.length) return Math.floor(10000000 + Math.random() * 90000000)
    const excludedSet = new Set(excludedNumbers);
    let number;

    do {
        number = Math.floor(10000000 + Math.random() * 90000000);
    } while (excludedSet.has(number));

    return number;
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
    convHourToMilsec,
    generateUniqueNumber,
    generateRandomNumber,
    fromMSstr,
    toMS,
};