"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const _1 = __importDefault(require("."));
const __1 = require("../..");
const cheerio_1 = require("cheerio");
class Zoro extends _1.default {
    rateLimit = 250;
    id = "zoro";
    url = "https://zoro.to";
    formats = ["MOVIE" /* Format.MOVIE */, "ONA" /* Format.ONA */, "OVA" /* Format.OVA */, "SPECIAL" /* Format.SPECIAL */, "TV" /* Format.TV */, "TV_SHORT" /* Format.TV_SHORT */];
    get subTypes() {
        return ["sub" /* SubType.SUB */, "dub" /* SubType.DUB */];
    }
    async search(query) {
        const { data } = await (0, axios_1.default)(`${this.url}/search?keyword=${encodeURIComponent(query)}`);
        const results = [];
        const $ = (0, cheerio_1.load)(data);
        $(".film_list-wrap > div.flw-item").map((i, el) => {
            const title = $(el).find("div.film-detail h3.film-name a.dynamic-name").attr("title").trim().replace(/\\n/g, "");
            const id = $(el).find("div:nth-child(1) > a").last().attr("href");
            const img = $(el).find("img").attr("data-src");
            const altTitles = [];
            const jpName = $(el).find("div.film-detail h3.film-name a.dynamic-name").attr("data-jname").trim().replace(/\\n/g, "");
            altTitles.push(jpName);
            const formatString = $(el).find("div.film-detail div.fd-infor span.fdi-item")?.first()?.text().toUpperCase();
            const format = __1.Formats.includes(formatString) ? formatString : "UNKNOWN" /* Format.UNKNOWN */;
            results.push({
                id: id,
                title: title,
                altTitles: altTitles,
                year: 0,
                format,
                img: img,
                providerId: this.id,
            });
        });
        return results;
    }
}
exports.default = Zoro;
