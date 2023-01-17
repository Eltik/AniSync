"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const colors = require("colors");
const config_1 = require("../../config");
const Anime_1 = require("./Anime");
const cronchy_1 = require("cronchy");
class CrunchyRoll extends Anime_1.default {
    constructor() {
        super("https://www.crunchyroll.com", "CrunchyRoll");
        this.config = config_1.config.mapping.provider.CrunchyRoll;
        this.hasInit = false;
        this.credentials = {
            email: this.config.email,
            password: this.config.password
        };
        this.cronchy = new cronchy_1.default(this.credentials.email, this.credentials.password);
    }
    async init() {
        await this.cronchy.login();
        this.hasInit = true;
        setInterval(() => {
            this.cronchy.login();
        }, 30000);
        return this.cronchy;
    }
    async search(query) {
        const results = [];
        const json = await this.cronchy.search(encodeURIComponent(query), 8).catch((err) => {
            return null;
        });
        if (!json) {
            if (config_1.config.crawling.debug) {
                console.log(colors.cyan("[CrunchyRoll]") + colors.red("Unable to fetch data for " + colors.white(query) + "."));
            }
            return [];
        }
        const data = json.data;
        const item = data[1] ? data[1] : data[0];
        const items = item ? item.items : null;
        if (!items) {
            console.log(colors.cyan("[CrunchyRoll]") + colors.red("Unable to parse data for " + query + "."));
            return [];
        }
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