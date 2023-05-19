"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const _1 = __importDefault(require("."));
const cheerio_1 = require("cheerio");
class ReadLightNovels extends _1.default {
    rateLimit = 250;
    id = "readlightnovels";
    url = "https://readlightnovels.net";
    formats = ["NOVEL" /* Format.NOVEL */];
    async search(query) {
        const results = [];
        const { data } = await axios_1.default.post(`${this.url}/?s=${encodeURIComponent(query)}`);
        const $ = (0, cheerio_1.load)(data);
        $("div.col-xs-12.col-sm-12.col-md-9.col-truyen-main > div:nth-child(1) > div > div:nth-child(2) > div.col-md-3.col-sm-6.col-xs-6.home-truyendecu").each((i, el) => {
            results.push({
                id: $(el).find("a").attr("href").split(this.url)[1],
                title: $(el).find("a").attr("title"),
                altTitles: [],
                img: $(el).find("a > img").attr("src"),
                year: 0,
                format: "NOVEL" /* Format.NOVEL */,
                providerId: this.id,
            });
        });
        return results;
    }
}
exports.default = ReadLightNovels;
