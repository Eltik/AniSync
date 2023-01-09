"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Anime_1 = require("./Anime");
const cheerio_1 = require("cheerio");
class ZoroTo extends Anime_1.default {
    constructor() {
        super("https://zoro.to", "ZoroTo");
    }
    async search(query) {
        const dom = await this.fetchDOM(`${this.baseUrl}/search?keyword=${encodeURIComponent(query)}`, ".film_list-wrap > div.flw-item");
        const results = [];
        const $ = (0, cheerio_1.load)(dom.Response.text());
        dom.Cheerio.map((index, element) => {
            const title = $(element).find('div.film-detail h3.film-name a.dynamic-name').attr('title').trim().replace(/\\n/g, '');
            const jName = $(element).find('div.film-detail h3.film-name a.dynamic-name').attr("data-jname").trim().replace(/\\n/g, '');
            const id = $(element).find('div:nth-child(1) > a').last().attr('href');
            const url = this.baseUrl + id;
            results.push({
                url,
                id,
                title,
                romaji: jName
            });
        });
        return results;
    }
}
exports.default = ZoroTo;
//# sourceMappingURL=ZoroTo.js.map