"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Manga_1 = require("./Manga");
class MangaSee extends Manga_1.default {
    constructor() {
        super("https://mangasee123.com", "MangaSee");
    }
    async search(query) {
        const list = await this.getMangaList();
        const results = [];
        for (let i = 0; i < list.length; i++) {
            if (this.stringSearch(list[i].s, query) >= 1) {
                results.push({
                    id: "/manga/" + list[i].i,
                    title: list[i].s,
                    url: `${this.baseUrl}/manga/${list[i].i}`,
                    img: `https://temp.compsci88.com/cover/${list[i].i}.jpg`,
                });
            }
        }
        return results;
    }
    async getMangaList() {
        const data = await this.fetch(`${this.baseUrl}/_search.php`, { method: "POST", headers: {
                Referer: this.baseUrl
            } });
        const res = data.json();
        return res;
    }
}
exports.default = MangaSee;
//# sourceMappingURL=MangaSee.js.map