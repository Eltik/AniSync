// From npm package string-similarity
export function compareTwoStrings(first, second): number {
    first = first.replace(/\s+/g, "");
    second = second.replace(/\s+/g, "");

    if (first === second) return 1; // identical or empty
    if (first.length < 2 || second.length < 2) return 0; // if either is a 0-letter or 1-letter string

    const firstBigrams = new Map();
    for (let i = 0; i < first.length - 1; i++) {
        const bigram = first.substring(i, i + 2);
        const count = firstBigrams.has(bigram) ? firstBigrams.get(bigram) + 1 : 1;

        firstBigrams.set(bigram, count);
    }

    let intersectionSize = 0;
    for (let i = 0; i < second.length - 1; i++) {
        const bigram = second.substring(i, i + 2);
        const count = firstBigrams.has(bigram) ? firstBigrams.get(bigram) : 0;

        if (count > 0) {
            firstBigrams.set(bigram, count - 1);
            intersectionSize++;
        }
    }

    return (2.0 * intersectionSize) / (first.length + second.length - 2);
}

export function findBestMatch(mainString, targetStrings): StringResult {
    if (!areArgsValid(mainString, targetStrings)) throw new Error("Bad arguments: First argument should be a string, second should be an array of strings");

    const ratings: { target: string; rating: number }[] = [];
    let bestMatchIndex = 0;

    for (let i = 0; i < targetStrings.length; i++) {
        const currentTargetString: string = targetStrings[i];
        const currentRating: number = compareTwoStrings(mainString, currentTargetString);
        ratings.push({ target: currentTargetString, rating: currentRating });
        if (currentRating > ratings[bestMatchIndex].rating) {
            bestMatchIndex = i;
        }
    }

    const bestMatch = ratings[bestMatchIndex];

    return { ratings: ratings, bestMatch: bestMatch, bestMatchIndex: bestMatchIndex };
}

function areArgsValid(mainString: string, targetStrings: string): boolean {
    if (typeof mainString !== "string") return false;
    if (!Array.isArray(targetStrings)) return false;
    if (!targetStrings.length) return false;
    if (
        targetStrings.find(function (s) {
            return typeof s !== "string";
        })
    )
        return false;
    return true;
}

interface StringResult {
    ratings: Array<{ target: string; rating: number }>;
    bestMatch: { target: string; rating: number };
    bestMatchIndex: number;
}
