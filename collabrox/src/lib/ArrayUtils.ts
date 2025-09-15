// Remove duplicate strings from two arrays and merge them
const removeDuplicStrAndMerge = (...arrays: string[][]): string[] => {
    return Array.from(new Set(arrays.flat()));
}

export {
    removeDuplicStrAndMerge,
}