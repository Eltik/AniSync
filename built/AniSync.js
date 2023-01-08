"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const API_1 = require("./API");
const StringSimilarity_1 = require("./StringSimilarity");
const config_1 = require("./config");
class AniSync extends API_1.default {
    constructor() {
        super();
        this.stringSim = new StringSimilarity_1.default();
        this.config = config_1.config.mapping.anime;
    }
    checkItem(result1, result2) {
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
exports.default = AniSync;
//# sourceMappingURL=AniSync.js.map