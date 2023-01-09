"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Anime_1 = require("./Anime");
class AnimePahe extends Anime_1.default {
    constructor() {
        super("https://animepahe.com", "AnimePahe");
    }
    async search(query) {
        const req = await this.fetchJSON(`${this.baseUrl}/api?m=search&q=${encodeURIComponent(query)}`);
        const data = req.json();
        return data.data.map((item) => ({
            id: item.session,
            title: item.title,
            img: item.poster,
            url: `${this.baseUrl}/anime/${item.session}`
        }));
    }
}
exports.default = AnimePahe;
//# sourceMappingURL=AnimePahe.js.map