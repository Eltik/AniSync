"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cheerio_1 = require("cheerio");
const Manga_1 = require("./Manga");
class MangaPark extends Manga_1.default {
    constructor() {
        super("https://v2.mangapark.net", "MangaPark");
    }
    async search(query) {
        const url = `${this.baseUrl}/search?q=${query}`;
        try {
            const data = await this.fetch(url);
            const $ = (0, cheerio_1.load)(data.text());
            const results = $('.item').get().map(item => {
                const cover = $(item).find('.cover');
                return {
                    id: `${cover.attr('href')}`,
                    url: `${this.baseUrl}${cover.attr("href")}`,
                    title: `${cover.attr('title')}`,
                    img: `${$(cover).find('img').attr('src')}}`,
                };
            });
            return results;
        }
        catch (err) {
            throw new Error(err.message);
        }
    }
}
exports.default = MangaPark;
//# sourceMappingURL=MangaPark.js.map