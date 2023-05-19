"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const _1 = __importDefault(require("."));
const cheerio_1 = require("cheerio");
const stringSimilarity_1 = require("../../../helper/stringSimilarity");
class JNovels extends _1.default {
    rateLimit = 250;
    id = "jnovels";
    url = "https://jnovels.com";
    formats = ["NOVEL" /* Format.NOVEL */];
    async search(query) {
        const results = [];
        const list = [];
        const req = await (0, axios_1.default)(`${this.url}/11light-1novel20-pdf/`);
        const $ = (0, cheerio_1.load)(req.data);
        $("div.post-content ol li").map((i, el) => {
            const id = $(el).find("a").attr("href")?.split(this.url)[1];
            const title = $(el).find("a").text()?.trim() ?? "";
            list.push({
                id: id,
                title: title,
                altTitles: [],
                img: null,
                year: 0,
                format: "NOVEL" /* Format.NOVEL */,
                providerId: this.id,
            });
        });
        for (const result of list) {
            if ((0, stringSimilarity_1.compareTwoStrings)(query, result.title) > 0.3) {
                results.push(result);
            }
        }
        if (results.length === 0) {
            const req = await (0, axios_1.default)(`${this.url}/hwebnovels-lista14/`);
            const $ = (0, cheerio_1.load)(req.data);
            $("div.post-content ol li").map((i, el) => {
                const id = $(el).find("a").attr("href").split(this.url)[1];
                const title = $(el).find("a").text()?.trim() ?? "";
                list.push({
                    id: id,
                    title: title,
                    altTitles: [],
                    img: null,
                    year: 0,
                    format: "NOVEL" /* Format.NOVEL */,
                    providerId: this.id,
                });
            });
            for (const result of list) {
                if ((0, stringSimilarity_1.compareTwoStrings)(query, result.title) > 0.3) {
                    results.push(result);
                }
            }
        }
        return results;
    }
}
exports.default = JNovels;
