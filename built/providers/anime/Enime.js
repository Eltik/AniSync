"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Anime_1 = require("./Anime");
class Enime extends Anime_1.default {
    constructor() {
        super("https://enime.moe", "Enime");
        this.api = 'https://api.enime.moe';
    }
    async search(query) {
        const page = 0;
        const perPage = 18;
        const req = await this.fetchJSON(`${this.api}/search/${query}?page=${page}&perPage=${perPage}`);
        const data = req.json();
        if (!data.data) {
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