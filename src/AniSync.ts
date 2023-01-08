import API from "./API";
import StringSimilarity from "./StringSimilarity";
import { config } from "./config";

export default class AniSync extends API {
    private stringSim:StringSimilarity = new StringSimilarity();
    private config = config.mapping.anime;
    
    constructor() {
        super();
    }

    public checkItem(result1:Mapping, result2:Mapping):number {
        let amount = 0;
        let tries = 0;

        result1.title = result1.title != undefined ? result1.title.toLowerCase() : undefined;
        result1.romaji = result1.romaji != undefined ? result1.romaji.toLowerCase() : undefined;
        result1.native = result1.native != undefined ? result1.native.toLowerCase() : undefined;

        result2.title = result2.title != undefined ? result2.title.toLowerCase() : undefined;
        result2.romaji = result2.romaji != undefined ? result2.romaji.toLowerCase() : undefined;
        result2.native = result2.native != undefined ? result2.native.toLowerCase() : undefined;

        // Check title
        if (result1.title != undefined && result2.title != undefined) {
            tries++;
            const stringComparison = this.stringSim.compareTwoStrings(result1.title, result2.title);
            if (result1.title === result2.title || stringComparison > this.config.threshold) {
                amount++;
            }
        }

        if (result1.romaji != undefined && result2.romaji != undefined) {
            tries++;
            const stringComparison = this.stringSim.compareTwoStrings(result1.romaji, result2.romaji);
            if (result1.romaji === result2.romaji || stringComparison > this.config.threshold) {
                amount++;
            }
        }

        if (result1.native != undefined && result2.native != undefined) {
            tries++;
            const stringComparison = this.stringSim.compareTwoStrings(result1.native, result2.native);
            if (result1.native === result2.native || stringComparison > this.config.threshold) {
                amount++;
            }
        }

        // Check genres
        /*
        if (this.config.check_genres) {
            if (result1.genres.length === result2.genres.length) {
                matches = false;
            } else {
                for (let i = 0; i < result1.genres.length; i++) {
                    if (result1.genres[i] != result2.genres[i] && this.stringSim.compareTwoStrings(result1.genres[i], result2.genres[i]) < this.config.threshold) {
                        matches = false;
                    }
                }
            }
        }
        */
        return amount / tries;
    }
}

interface Mapping {
    title?: string;
    romaji?: string;
    native?: string;
    genres?: string[];
}

export type { Mapping };