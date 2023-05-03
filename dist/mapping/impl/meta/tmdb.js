"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const _1 = __importDefault(require("."));
class TMDB extends _1.default {
    id = "tmdb";
    url = "https://themoviedb.org";
    formats = ["TV" /* Format.TV */, "MOVIE" /* Format.MOVIE */, "ONA" /* Format.ONA */, "SPECIAL" /* Format.SPECIAL */, "TV_SHORT" /* Format.TV_SHORT */, "OVA" /* Format.OVA */];
    tmdbApiUrl = "https://api.themoviedb.org/3";
    apiKey = "5201b54eb0968700e693a30576d7d4dc";
    async search(query) {
        const results = [];
        const page = 1;
        const searchUrl = `/search/multi?api_key=${this.apiKey}&language=en-US&page=${page}&include_adult=false&query=${encodeURIComponent(query)}`;
        const { data } = await (0, axios_1.default)(this.url + searchUrl);
        if (data.results.length > 0) {
            data.results.forEach((result) => {
                if (result.media_type === "tv") {
                    results.push({
                        id: `/tv/${result.id}`,
                        title: result.title || result.name,
                        altTitles: [result.original_title || result.original_name, result.title || result.name],
                        img: `https://image.tmdb.org/t/p/w500${result.poster_path}`,
                        year: result.first_air_date ? new Date(result.first_air_date).getFullYear() : 0,
                        providerId: this.id,
                    });
                }
                else if (result.media_type === "movie") {
                    results.push({
                        id: `/movie/${result.id}`,
                        title: result.title || result.name,
                        altTitles: [result.original_title || result.original_name, result.title || result.name],
                        img: `https://image.tmdb.org/t/p/w500${result.poster_path}`,
                        year: result.first_air_date ? new Date(result.first_air_date).getFullYear() : 0,
                        providerId: this.id,
                    });
                }
            });
            return results;
        }
        else {
            return results;
        }
    }
}
exports.default = TMDB;
