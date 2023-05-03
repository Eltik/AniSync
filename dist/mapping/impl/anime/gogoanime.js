"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const _1 = __importDefault(require("."));
const cheerio_1 = require("cheerio");
class GogoAnime extends _1.default {
    id = "gogoanime";
    url = "https://gogoanime.cl";
    formats = ["MOVIE" /* Format.MOVIE */, "ONA" /* Format.ONA */, "OVA" /* Format.OVA */, "SPECIAL" /* Format.SPECIAL */, "TV" /* Format.TV */, "TV_SHORT" /* Format.TV_SHORT */];
    get subTypes() {
        return ["sub" /* SubType.SUB */, "dub" /* SubType.DUB */];
    }
    async search(query) {
        const { data } = await (0, axios_1.default)(`${this.url}/search.html?keyword=${encodeURIComponent(query)}`);
        const results = [];
        const $ = (0, cheerio_1.load)(data);
        $("ul.items > li").map((i, el) => {
            const title = $(el).find("div.img a").attr("title").trim().replace(/\\n/g, "");
            const id = $(el).find("div.img a").attr("href");
            const year = (parseInt($("p.released").text()?.split("Released: ")[1]) ?? 0);
            const img = $(el).find("div.img a img").attr("src");
            results.push({
                id: id,
                title: title,
                altTitles: [],
                img: img,
                year: year,
                providerId: this.id
            });
        });
        return results;
    }
}
exports.default = GogoAnime;
