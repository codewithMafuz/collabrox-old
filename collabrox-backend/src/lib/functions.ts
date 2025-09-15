// Basic list of scorewords to ignore
const stopwords = new Set([
    'a', 'an', 'and', 'the', 'in', 'on', 'is', 'to', 'of', 'for', 'with',
    'as', 'by', 'at', 'be', 'that', 'are', 'was', 'it', 'this', 'but',
    'or', 'not', 'they', 'we', 'he', 'she', 'his', 'her', 'their', 'our'
]);

// Normalize and tokenize text
function tokenize(text: string) {
    return text.toLowerCase()
        .replace(/[^\w\s]/g, '') // remove punctuation
        .split(/\s+/) // split by whitespace
        .filter(t => t.length > 2 && !stopwords.has(t)); // filter small words & stopwords
}

// Jaccard similarity between two arrays
function jaccard(arr1: string[], arr2: string[]) {
    const setA = new Set(arr1);
    const setB = new Set(arr2);
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return intersection.size / union.size;
}

function bioSimilarityScore(str1: string, str2: string) {
    if (!str1 || !str2) return 0;

    const tokens1 = tokenize(str1);
    const tokens2 = tokenize(str2);

    let score = jaccard(tokens1, tokens2);
    return Math.round(score * 100) / 100; // Round to 2 decimal places
}

function extractRelativePathFirebase(url: string) {
    const parts = url.split('/o/');
    if (parts.length < 2) return '';
    const [encodedPath] = parts[1].split('?');
    return decodeURIComponent(encodedPath);
}


export {
    bioSimilarityScore,
    extractRelativePathFirebase,
}