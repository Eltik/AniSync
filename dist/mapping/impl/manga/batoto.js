"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const _1 = __importDefault(require("."));
const cheerio_1 = require("cheerio");
class BatoTo extends _1.default {
    id = "batoto";
    url = "https://bato.to";
    formats = ["MANGA" /* Format.MANGA */, "ONE_SHOT" /* Format.ONE_SHOT */];
    async search(query) {
        const results = [];
        const { data } = await (0, axios_1.default)(`${this.url}/search?word=${encodeURIComponent(query)}`);
        const $ = (0, cheerio_1.load)(data);
        $("div#series-list div.item").each((i, el) => {
            const id = $(el).find("a").attr("href");
            const title = $(el).find("a.item-title").text();
            const altTitles = [];
            const altTitleText = $(el).find("div.item-alias").first().text();
            altTitleText.split("/").map((altTitle) => {
                altTitles.push(altTitle.trim());
            });
            const img = $(el).find("img").attr("src");
            results.push({
                id,
                altTitles,
                img,
                title,
                year: 0,
                providerId: this.id,
            });
        });
        return results;
    }
}
exports.default = BatoTo;
