"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const colors = require("colors");
const config_1 = require("../../config");
const Anime_1 = require("./Anime");
class Enime extends Anime_1.default {
    constructor() {
        super("https://enime.moe", "Enime");
        this.api = 'https://api.enime.moe';
    }
    async search(query) {
        const page = 0;
        const perPage = 18;
        const req = await this.fetch(`${this.api}/search/${encodeURIComponent(query)}?page=${page}&perPage=${perPage}`);
        const data = req.json();
        if (!data.data) {
            if (config_1.config.crawling.debug) {
                console.log(colors.cyan("[CrunchyRoll]") + colors.red("Unable to parse data for " + query + "."));
            }
            return [];
        }
        return data.data.map((item) => ({
            id: item.id,
            title: item.title.english ?? item.title.romaji ?? item.title.native,
            romaji: item.title.romaji,
            native: item.title.native,
            img: item.coverImage,
        }));
    }
}
exports.default = Enime;
//# sourceMappingURL=Enime.js.map