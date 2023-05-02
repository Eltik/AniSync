export declare function compareTwoStrings(first: any, second: any): number;
export declare function findBestMatch(mainString: any, targetStrings: any): StringResult;
interface StringResult {
    ratings: Array<{
        target: string;
        rating: number;
    }>;
    bestMatch: {
        target: string;
        rating: number;
    };
    bestMatchIndex: number;
}
export {};
