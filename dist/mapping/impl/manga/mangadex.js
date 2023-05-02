"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const helper_1 = require("@/src/helper");
const _1 = __importDefault(require("."));
const axios_1 = __importDefault(require("axios"));
class MangaDex extends _1.default {
    id = "mangadex";
    url = "https://mangadex.org";
    formats = ["MANGA" /* Format.MANGA */, "ONE_SHOT" /* Format.ONE_SHOT */];
    api = "https://api.mangadex.org";
    async search(query) {
        const results = [];
        let mangaList = [];
        for (let page = 0; page <= 1; page += 1) {
            const uri = new URL('/manga', this.api);
            uri.searchParams.set('title', query);
            uri.searchParams.set('limit', "25");
            uri.searchParams.set('offset', String(25 * page).toString());
            uri.searchParams.set('order[relevance]', 'desc');
            uri.searchParams.append('contentRating[]', 'safe');
            uri.searchParams.append('contentRating[]', 'suggestive');
            uri.searchParams.append('contentRating[]', 'erotica');
            uri.searchParams.append('contentRating[]', 'pornographic');
            uri.searchParams.append("includes[]", "cover_art");
            const request = await (0, axios_1.default)(uri.href);
            // API rate limit
            await (0, helper_1.wait)(250);
            mangaList = ([...mangaList, ...request.data.data]);
        }
        for (let i = 0; i < mangaList.length; i++) {
            const manga = mangaList[i];
            const attributes = manga.attributes;
            const relationships = manga.relationships;
            const title = attributes.title["en"] ?? attributes.title["ja"] ?? attributes.title["ja-ro"] ?? attributes.title["ko"];
            const altTitles = [];
            attributes.altTitles.map((element, index) => {
                const temp = element;
                if (temp["ja-ro"] != undefined) {
                    altTitles.push(temp["ja-ro"]);
                }
                if (temp["ja"] != undefined) {
                    altTitles.push(temp["ja"]);
                }
                if (temp["ko"] != undefined) {
                    altTitles.push(temp["ko"]);
                }
                if (temp["en"] != undefined) {
                    altTitles.push(temp["en"]);
                }
            });
            const id = manga.id;
            let img = "";
            relationships.map((element) => {
                if (element.type === "cover_art") {
                    img = `${this.url}/covers/${id}/${element.id}.jpg.512.jpg`;
                }
            });
            results.push({
                id,
                title: title,
                altTitles: altTitles,
                img: img,
                providerId: this.id,
            });
        }
        return results;
    }
}
exports.default = MangaDex;
