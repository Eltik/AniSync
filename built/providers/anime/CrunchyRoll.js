"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../../config");
const Anime_1 = require("./Anime");
const cronchy_1 = require("cronchy");
class CrunchyRoll extends Anime_1.default {
    constructor() {
        super("https://www.crunchyroll.com", "CrunchyRoll");
        this.config = config_1.config.mapping.anime.crunchyroll;
        this.credentials = {
            email: this.config.email,
            password: this.config.password
        };
        this.cronchy = new cronchy_1.default(this.credentials.email, this.credentials.password);
    }
    async init() {
        await this.cronchy.login();
        return this.cronchy;
    }
    async search(query) {
        const results = [];
        const json = await this.cronchy.search(query, 8);
        const data = json.data;
        const items = data[1].items;
        items.map((item, index) => {
            const images = item.images.poster_tall;
            const url = `${this.baseUrl}/series/${item.id}`;
            const id = `/series/${item.id}`;
            const title = item.title;
            const img = images[0][images.length - 1].source;
            results.push({
                url,
                id,
                title,
                img
            });
        });
        return results;
    }
}
exports.default = CrunchyRoll;
//# sourceMappingURL=CrunchyRoll.js.map