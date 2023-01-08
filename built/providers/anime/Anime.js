"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const API_1 = require("../../API");
const sqlite3_1 = require("sqlite3");
class Anime extends API_1.default {
    constructor(baseUrl, providerName) {
        super();
        this.baseUrl = undefined;
        this.providerName = undefined;
        this.db = new sqlite3_1.Database((0, path_1.join)(__dirname, "../db.db"));
        this.AGGREGATORS = {
            ZoroTo: "https://zoro.to",
            Crunchyroll: "https://crunchyroll.com"
        };
        this.baseUrl = baseUrl;
        this.providerName = providerName;
    }
    async search(any) {
        throw new Error("Method not implemented.");
    }
}
exports.default = Anime;
//# sourceMappingURL=Anime.js.map