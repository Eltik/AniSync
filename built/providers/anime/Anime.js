"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const API_1 = require("../../API");
const sqlite3_1 = require("sqlite3");
const AniSync_1 = require("../../AniSync");
const config_1 = require("../../config");
class Anime extends API_1.default {
    constructor(baseUrl) {
        super();
        this.baseUrl = undefined;
        this.db = new sqlite3_1.Database((0, path_1.join)(__dirname, "../db.db"));
        this.aniSync = new AniSync_1.default();
        this.config = config_1.config.mapping.anime;
        this.AGGREGATORS = {
            ZoroTo: "https://zoro.to",
            Crunchyroll: "https://crunchyroll.com"
        };
        this.baseUrl = baseUrl;
    }
    async search(any) {
        throw new Error("Method not implemented.");
    }
    compare(anime, aniList) {
        const result = [];
        for (let i = 0; i < aniList.length; i++) {
            const media = aniList[i];
            const map1 = {
                title: anime.title,
                romaji: anime.romaji,
                native: anime.native
            };
            const map2 = {
                title: media.title.english,
                romaji: media.title.romaji,
                native: media.title.native
            };
            const comparison = this.aniSync.checkItem(map1, map2);
            if (comparison > this.config.comparison_threshold) {
                result.push({
                    anime,
                    media,
                    comparison
                });
            }
        }
        // It is possible that there are multiple results, so we need to sort them. But generally, there should only be one result.
        return result[0];
    }
}
exports.default = Anime;
//# sourceMappingURL=Anime.js.map