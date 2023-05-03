"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = __importDefault(require("."));
const cheerio_1 = require("cheerio");
const cfbypass_1 = __importDefault(require("cfbypass"));
class NovelUpdates extends _1.default {
    id = "novelupdates";
    url = "https://www.novelupdates.com";
    formats = ["NOVEL" /* Format.NOVEL */];
    cfbypass = new cfbypass_1.default((process.env.USE_PYTHON3.toLowerCase() == "true" ? true : false) || false);
    async search(query) {
        const results = [];
        const body = {
            action: "nd_ajaxsearchmain",
            strType: "desktop",
            strOne: query,
            strSearchType: "series"
        };
        const req = await this.cfbypass.request({
            url: `${this.url}/wp-admin/admin-ajax.php`,
            options: {
                method: "POST",
                body: body,
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Referer: this.url,
                    "X-Requested-With": "XMLHttpRequest"
                }
            }
        });
        const $ = (0, cheerio_1.load)(req.text());
        $("ul li").map((i, el) => {
            const url = `${$(el).find("a").attr("href")}`;
            const title = $(el).text();
            const img = `https:${$(el).find("img").attr("src")}`;
            results.push({
                id: url,
                title: title?.trim(),
                img: img,
                year: 0,
                altTitles: [],
                providerId: this.id
            });
        });
        return results;
    }
}
exports.default = NovelUpdates;
