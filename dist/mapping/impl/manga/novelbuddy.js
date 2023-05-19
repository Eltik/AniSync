"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const _1 = __importDefault(require("."));
const cheerio_1 = require("cheerio");
class NovelBuddy extends _1.default {
    rateLimit = 250;
    id = "novelbuddy";
    url = "https://novelbuddy.com";
    formats = ["NOVEL" /* Format.NOVEL */];
    async search(query) {
        const results = [];
        const { data } = await (0, axios_1.default)(`${this.url}/search?q=${encodeURIComponent(query)}`);
        const $ = (0, cheerio_1.load)(data);
        $("div.container div.manga-list div.book-item").map((i, el) => {
            const url = `${$(el).find("a").attr("href")}`;
            const title = $(el).find("a").attr("title");
            const img = `https:${$(el).find("img").attr("data-src")}`;
            results.push({
                id: url,
                title: title?.trim(),
                img: img,
                year: 0,
                format: "NOVEL" /* Format.NOVEL */,
                altTitles: [],
                providerId: this.id,
            });
        });
        return results;
    }
}
exports.default = NovelBuddy;
