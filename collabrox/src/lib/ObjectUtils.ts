const filterObject = (obj: Record<string, any>, filterValues: any[] = [undefined]): Record<string, any> => {
    return Object.fromEntries(
        Object.entries(obj).filter(([_, value]) => !filterValues.includes(value))
    );
}


const isEqualRecords = (obj1: Record<string, any>, obj2: Record<string, any>): boolean => {
    // Early return if both are same reference
    if (obj1 === obj2) return true;

    if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
        return false;
    }

    const obj1Keys = Object.keys(obj1);
    const obj2Keys = Object.keys(obj2);

    // If number of keys is different, not equal
    if (obj1Keys.length !== obj2Keys.length) return false;

    // Compare each key and value in obj1
    for (const key of obj1Keys) {
        // If obj2 doesn't have the same key, that means not equal
        if (!Object.prototype.hasOwnProperty.call(obj2, key)) return false;

        const val1 = obj1[key];
        const val2 = obj2[key];

        // If both values are objects, recursively compare
        if (typeof val1 === 'object' && val1 !== null && typeof val2 === 'object' && val2 !== null) {
            if (!isEqualRecords(val1, val2)) return false;
        }
        else {
            // If primitive values are not equal
            if (val1 !== val2) return false;
        }
    }

    // This stage means all checks passed, so objects are deeply equal
    return true;
};


export {
    filterObject,
    isEqualRecords,
}