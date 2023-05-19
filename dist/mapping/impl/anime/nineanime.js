"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cheerio_1 = require("cheerio");
const _1 = __importDefault(require("."));
const axios_1 = __importDefault(require("axios"));
const __1 = require("../..");
class NineAnime extends _1.default {
    rateLimit = 250;
    id = "9anime";
    url = "https://9anime.to";
    formats = ["MOVIE" /* Format.MOVIE */, "ONA" /* Format.ONA */, "OVA" /* Format.OVA */, "SPECIAL" /* Format.SPECIAL */, "TV" /* Format.TV */, "TV_SHORT" /* Format.TV_SHORT */];
    resolver = process.env.NINEANIME_RESOLVER || `https://9anime.resolver.com`;
    resolverKey = process.env.NINEANIME_KEY || `9anime`;
    get subTypes() {
        return ["sub" /* SubType.SUB */, "dub" /* SubType.DUB */];
    }
    async search(query) {
        const vrf = await this.getSearchVRF(query);
        const results = [];
        const { data } = await (0, axios_1.default)(`${this.url}/ajax/anime/search?keyword=${encodeURIComponent(query)}&${vrf.vrfQuery}=${encodeURIComponent(vrf.url)}`);
        const $ = (0, cheerio_1.load)(data.result.html);
        $("div.items > a.item").each((i, el) => {
            const title = $(el).find("div.name");
            const altTitles = [title.attr("data-jp")];
            const year = parseInt($(el).find("div.info div.meta span.dot").last()?.text()?.trim()?.split(",")[1]) ?? 0;
            const formatString = $(el).find("div.info div.meta span.dot").eq(-2)?.text()?.trim();
            const format = __1.Formats.includes(formatString) ? formatString : "UNKNOWN" /* Format.UNKNOWN */;
            results.push({
                id: $(el).attr("href"),
                title: title.text().trim(),
                altTitles,
                year,
                format,
                img: $(el).find("img").attr("src"),
                providerId: this.id,
            });
        });
        return results;
    }
    async getSearchVRF(query) {
        return (await (0, axios_1.default)(`${this.resolver}/9anime-search?query=${encodeURIComponent(query)}&apikey=${this.resolverKey}`)).data;
    }
}
exports.default = NineAnime;
