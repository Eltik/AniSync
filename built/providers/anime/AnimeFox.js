"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Anime_1 = require("./Anime");
const cheerio_1 = require("cheerio");
class AnimeFox extends Anime_1.default {
    constructor() {
        super("https://animefox.tv", "AnimeFox");
    }
    async search(query) {
        const dom = await this.fetchDOM(`${this.baseUrl}/search?keyword=${encodeURIComponent(query)}`, "div.film_list-wrap > div");
        const results = [];
        const $ = (0, cheerio_1.load)(dom.Response.text());
        dom.Cheerio.map((index, element) => {
            const id = $(element).find("div.film-poster > a").attr('href');
            // Title is generally just the romaji name, or the same as the jname
            //const title = $(element).find("a.dynamic-name").attr('title')!;
            const jName = $(element).find("a.dynamic-name").attr("data-jname");
            const format = $(element).find("div.fd-infor > span:nth-child(1)").text().split(" ")[0];
            const url = this.baseUrl + id;
            results.push({
                url,
                id,
                format,
                romaji: jName
            });
        });
        return results;
    }
}
exports.default = AnimeFox;
//# sourceMappingURL=AnimeFox.js.map