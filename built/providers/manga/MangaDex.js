"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../../config");
const Manga_1 = require("./Manga");
class MangaDex extends Manga_1.default {
    constructor() {
        super("https://mangadex.org", "MangaDex");
        this.api = "https://api.mangadex.org";
        this.config = config_1.config.mapping.provider.MangaDex;
    }
    async search(query) {
        let mangaList = [];
        const results = [];
        for (let page = 0; page <= 1; page += 1) {
            const uri = new URL('/manga', this.api);
            uri.searchParams.set('title', query);
            uri.searchParams.set('limit', "25");
            uri.searchParams.set('offset', String(25 * page).toString());
            uri.searchParams.set('order[createdAt]', 'asc');
            uri.searchParams.append('contentRating[]', 'safe');
            uri.searchParams.append('contentRating[]', 'suggestive');
            uri.searchParams.append('contentRating[]', 'erotica');
            uri.searchParams.append('contentRating[]', 'pornographic');
            const request = await this.fetch(uri.href);
            await this.wait(this.config.wait);
            mangaList = [...mangaList, ...request.json().data];
        }
        for (let i = 0; i < mangaList.length; i++) {
            const manga = mangaList[i];
            const attributes = manga.attributes;
            const relationships = manga.relationships;
            const title = attributes.title["en"];
            let romaji = undefined;
            let native = undefined;
            let korean = undefined;
            attributes.altTitles.map((element, index) => {
                const title = element;
                if (title["ja-ro"] != undefined) {
                    romaji = title["ja-ro"];
                }
                if (title["ja"] != undefined) {
                    native = title["ja"];
                }
                if (title["ko"] != undefined) {
                    korean = title["ko"];
                }
            });
            if (!native && korean != undefined) {
                native = korean;
            }
            const id = manga.id;
            const url = `${this.baseUrl}/title/${id}`;
            let img = "";
            relationships.map((element) => {
                if (element.type === "cover_art") {
                    img = `${this.baseUrl}/covers/${id}/${element.id}.jpg.512.jpg`;
                }
            });
            results.push({
                url: url,
                title: title,
                id: id,
                img: img,
                romaji: romaji,
                native: native,
                year: String(attributes.year)
            });
        }
        return results;
    }
}
exports.default = MangaDex;
//# sourceMappingURL=MangaDex.js.map