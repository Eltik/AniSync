"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const _1 = __importDefault(require("."));
class AnimePahe extends _1.default {
    id = "animepahe";
    url = "https://animepahe.com";
    formats = ["MOVIE" /* Format.MOVIE */, "ONA" /* Format.ONA */, "OVA" /* Format.OVA */, "SPECIAL" /* Format.SPECIAL */, "TV" /* Format.TV */, "TV_SHORT" /* Format.TV_SHORT */];
    get subTypes() {
        return ["sub" /* SubType.SUB */, "dub" /* SubType.DUB */];
    }
    async search(query) {
        const { data } = await (0, axios_1.default)(`${this.url}/api?m=search&q=${encodeURIComponent(query)}`);
        const results = [];
        if (!data.data) {
            return [];
        }
        data.data.map((item) => {
            results.push({
                id: String(item.id) ?? item.session,
                title: item.title,
                year: item.year,
                img: item.poster,
                altTitles: [],
                providerId: this.id
            });
        });
        return results;
    }
}
exports.default = AnimePahe;
