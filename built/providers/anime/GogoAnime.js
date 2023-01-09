"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Anime_1 = require("./Anime");
const cheerio_1 = require("cheerio");
class GogoAnime extends Anime_1.default {
    constructor() {
        super("https://www.gogoanime.dk", "GogoAnime");
    }
    async search(query) {
        const page = 0;
        const dom = await this.fetchDOM(`${this.baseUrl}/search.html?keyword=${encodeURIComponent(query)}&page=${page}`, "div.last_episodes > ul > li");
        const results = [];
        const $ = (0, cheerio_1.load)(dom.Response.text());
        dom.Cheerio.map((index, element) => {
            const title = $(element).find('p.name > a').attr('title');
            const img = $(element).find('div > a > img').attr('src');
            const id = "/category/" + $(element).find('p.name > a').attr('href')?.split('/')[2];
            const url = this.baseUrl + id;
            results.push({
                url,
                id,
                img,
                title,
            });
        });
        return results;
    }
}
exports.default = GogoAnime;
//# sourceMappingURL=GogoAnime.js.map