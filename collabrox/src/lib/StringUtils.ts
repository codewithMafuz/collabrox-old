

const classNames = (...classes: (string | undefined | boolean)[]) => classes.filter(c => c).join(' ');

/**
 * To check if two word most probably have similarity but one character slipped
 * @param {String} keyword - (At leat 4 characters) - The string that 2nd parameter query will be checked inside, or the string that maybe changes inside your for loop if used inside loop
 * @param {String} query - (At least 4 characters) - The parmanent query to check
 * @returns {Boolean} Boolean (true | false)
 */
const isOneCharSlipped = (keyword: string, query: string): boolean => {
    const keywordLength = keyword.length;
    const queryLength = query.length;

    // Ensure both strings have at least 4 characters and a max length difference of 1
    if (Math.min(keywordLength, queryLength) > 3 && Math.abs(keywordLength - queryLength) < 2) {
        let hasSlipped = false; // To track if a slip has occurred
        let keywordIndex = 0;
        let queryIndex = 0;

        while (keywordIndex < keywordLength && queryIndex < queryLength) {
            if (keyword[keywordIndex] !== query[queryIndex]) {
                if (hasSlipped) return false; // If already slipped once, returning false

                hasSlipped = true; // Marking that a slip was found

                if (keywordLength === queryLength) {
                    // Case: Swapped adjacent characters (e.g., "abcd" vs "acbd")
                    if (
                        keyword[keywordIndex] === query[queryIndex + 1] &&
                        keyword[keywordIndex + 1] === query[queryIndex]
                    ) {
                        // Skipping over the swapped pair
                        keywordIndex++;
                        queryIndex++;
                    } else {
                        return false;
                    }
                } else if (keywordLength > queryLength) {
                    // Case: Extra character in keyword (e.g., "abcde" vs "abde")
                    keywordIndex++; // Skipping one character in keyword
                } else {
                    // Case: Extra character in query (e.g., "abde" vs "abcde")
                    queryIndex++; // Skipping one character in query
                }
            }
            keywordIndex++;
            queryIndex++;
        }
        return hasSlipped; // Returning true if exactly one slip was detected
    }

    return false;
};

const textShorteningByWord = (text: string | any, index: number = 140, ending: string = "..."): string => {
    if (!text || typeof text !== 'string') return '';

    if (text.length <= index) return text;

    const nearestSpace = text.slice(0, index).lastIndexOf(' ');
    return text.slice(0, nearestSpace > 0 ? nearestSpace : index) + ending;
};

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

const createSafeRegex = (pattern: string | RegExp) => {
    try {
        return new RegExp(pattern);
    } catch (e) {
        console.error(`Invalid regex pattern: {${pattern}}`);
        return new RegExp('^$');
    }
};

const getLongestCommonPrefixLengthCharCode = (str1: string, str2: string) =>
    [...str1 as any].findIndex((ch, i) => ch.charCodeAt(0) !== str2.charCodeAt(i)) || Math.min(str1.length, str2.length);

const camelCaseToNormal = (str: string) => str.replace(/([A-Z])/g, ' $1').toLowerCase()

const countChar = (str: string, char: string): number => !char.length ? 0 : str.split(char).length - 1;

const sanitizeMultiSpacesIntoOne = (str: string) => str.replace(/\s+/g, ' ')

const sanitizeEmail = (s: string) => s.replace(/[^a-z0-9@._+-]/gi, '');

export {
    classNames,
    isOneCharSlipped,
    textShorteningByWord,
    capitalize,
    createSafeRegex,
    getLongestCommonPrefixLengthCharCode,
    camelCaseToNormal,
    countChar,
    sanitizeMultiSpacesIntoOne,
    sanitizeEmail,
}