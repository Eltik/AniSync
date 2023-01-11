"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Manga_1 = require("./Manga");
class ComicK extends Manga_1.default {
    constructor() {
        super("https://comick.app", "ComicK");
        this.api = "https://api.comick.app";
        this.image = "https://meo.comick.pictures";
    }
    async search(query) {
        const data = await this.fetch(`${this.api}/search?q=${encodeURIComponent(query)}`);
        const json = data.json();
        const results = json.map((result) => {
            let cover = result.md_covers ? result.md_covers[0] : null;
            if (cover && cover.b2key != undefined) {
                cover = this.image + cover.b2key;
            }
            // There are alt titles in the md_titles array
            return {
                url: this.baseUrl + "/comic/" + result.slug,
                id: "/comic/" + result.slug,
                img: cover,
                title: result.title ? result.title : result.slug
            };
        });
        return results;
    }
}
exports.default = ComicK;
//# sourceMappingURL=ComicK.js.map