"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const _1 = __importDefault(require("."));
const helper_1 = require("@/src/helper");
class MangaSee extends _1.default {
    id = "mangasee";
    url = "https://mangasee123.com";
    formats = ["MANGA" /* Format.MANGA */, "ONE_SHOT" /* Format.ONE_SHOT */];
    async search(query) {
        const list = await this.getMangaList();
        const results = [];
        for (let i = 0; i < list.length; i++) {
            if ((0, helper_1.stringSearch)(list[i].s, query) >= 1) {
                results.push({
                    title: list[i].s,
                    id: `/manga/${list[i].i}`,
                    altTitles: list[i].a,
                    year: 0,
                    img: null,
                    providerId: this.id,
                });
            }
        }
        return results;
    }
    async getMangaList() {
        const req = await (0, axios_1.default)(`${this.url}/_search.php`, { method: "POST", headers: {
                Referer: this.url
            } });
        const data = req.data;
        return data;
    }
}
exports.default = MangaSee;
