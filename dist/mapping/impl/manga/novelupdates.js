"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = __importDefault(require("."));
const cheerio_1 = require("cheerio");
const cloudscraper_ts_1 = __importDefault(require("cloudscraper-ts"));
class NovelUpdates extends _1.default {
    rateLimit = 1000;
    id = "novelupdates";
    url = "https://www.novelupdates.com";
    formats = ["NOVEL" /* Format.NOVEL */];
    async search(query) {
        const results = [];
        const body = {
            action: "nd_ajaxsearchmain",
            strType: "desktop",
            strOne: query,
            strSearchType: "series",
        };
        const req = await (0, cloudscraper_ts_1.default)({
            uri: `${this.url}/wp-admin/admin-ajax.php`,
            method: "POST",
            formData: body,
        });
        const $ = (0, cheerio_1.load)(req);
        $("ul li").map((i, el) => {
            const url = `${$(el).find("a").attr("href")}`;
            const title = $(el).text();
            const img = `https:${$(el).find("img").attr("src")}`;
            results.push({
                id: url,
                title: title?.trim(),
                img: img,
                altTitles: [],
                year: 0,
                format: "NOVEL" /* Format.NOVEL */,
                providerId: this.id,
            });
        });
        return results;
    }
}
exports.default = NovelUpdates;
