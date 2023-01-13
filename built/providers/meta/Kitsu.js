"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Meta_1 = require("./Meta");
class Kitsu extends Meta_1.default {
    constructor() {
        super("https://kitsu.io", "Kitsu");
        this.api = 'https://kitsu.io/api/edge';
    }
    async searchAnime(query) {
        const results = [];
        const searchUrl = `/anime?filter[text]=${encodeURIComponent(query)}`;
        try {
            const req = await this.fetch(this.api + searchUrl, {
                headers: {
                    "Accept": "application/vnd.api+json",
                    "Content-Type": "application/vnd.api+json"
                }
            }).catch((err) => {
                return null;
            });
            if (!req) {
                return results;
            }
            const data = req.json();
            if (data.data.length > 0) {
                data.data.forEach((result) => {
                    results.push({
                        id: result.id,
                        title: result.attributes.titles.en_us,
                        romaji: result.attributes.titles.en_jp,
                        native: result.attributes.titles.ja_jp,
                        img: result.attributes.posterImage.original,
                        url: result.links.self,
                    });
                });
                return results;
            }
            else {
                return results;
            }
        }
        catch (e) {
            throw new Error(e);
        }
    }
    async searchManga(query) {
        const results = [];
        const searchUrl = `/manga?filter[text]=${encodeURIComponent(query)}`;
        try {
            const req = await this.fetch(this.api + searchUrl, {
                headers: {
                    "Accept": "application/vnd.api+json",
                    "Content-Type": "application/vnd.api+json"
                }
            }).catch((err) => {
                return null;
            });
            if (!req) {
                return results;
            }
            const data = req.json();
            if (data.data.length > 0) {
                data.data.forEach((result) => {
                    results.push({
                        id: result.id,
                        title: result.attributes.titles.en,
                        romaji: result.attributes.titles.en_jp,
                        native: result.attributes.titles.ja_jp,
                        img: result.attributes.posterImage.original,
                        url: result.links.self,
                    });
                });
                return results;
            }
            else {
                return results;
            }
        }
        catch (e) {
            throw new Error(e);
        }
    }
}
exports.default = Kitsu;
//# sourceMappingURL=Kitsu.js.map