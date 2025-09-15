
const camelCaseToNormal = (str: string) => str.replace(/([A-Z])/g, '_$1').toUpperCase()

const countChar = (str: string, char: string): number => !char.length ? 0 : str.split(char).length - 1;

/**
 * Sanitize query string by removing special characters (generally used for Elastic search input query)
 */
const sanitizedQuery = (q: string) => q ? q.trim().replace(/([+\-&|!(){}[\]^"~*?:\\])/g, '\\$1') : '';

/**
 * To check if two word most probably have similarity but one character slipped
 * @param {String} keyword - (At leat 4 characters) - The string that 2nd parameter query will be checked inside, or the string that maybe changes inside your for loop if used inside loop
 * @param {String} query - (At least 4 characters) - The parmanent query to check
 * @returns {Boolean} Boolean (true | false)
 */
const isOneCharSlipped = (keyword: string, query: string) => {
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

export {
    camelCaseToNormal,
    countChar,
    sanitizedQuery,
    isOneCharSlipped,
}