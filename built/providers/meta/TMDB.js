"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../../config");
const Meta_1 = require("./Meta");
class TMDB extends Meta_1.default {
    constructor() {
        super("https://www.themoviedb.org", "TMDB");
        this.config = config_1.config.mapping.provider.TMDB;
        this.apiUrl = 'https://api.themoviedb.org/3';
    }
    async search(query) {
        const results = [];
        const page = 0;
        const searchUrl = `/search/multi?api_key=${this.config.api_key}&language=en-US&page=${page}&include_adult=false&query=${query}`;
        try {
            const req = await this.fetch(this.baseUrl + searchUrl);
            const data = req.json();
            if (data.results.length > 0) {
                data.results.forEach((result) => {
                    if (result.media_type === "tv") {
                        results.push({
                            id: "/tv/" + result.id,
                            title: result.name,
                            img: `${result.poster_path}`,
                            url: `https://www.themoviedb.org/tv/${result.id}`,
                            native: result.original_name,
                        });
                    }
                    else if (result.media_type === "movie") {
                        results.push({
                            id: "/movie/" + result.id,
                            title: result.name,
                            img: `${result.poster_path}`,
                            url: `https://www.themoviedb.org/movie/${result.id}`,
                            native: result.original_name,
                        });
                    }
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
    // someone add interface lol thanks
    async getInfo(id) {
        const searchUrl = `${id}?api_key=${this.config.api_key}&language=en-US&append_to_response=release_dates,watch/providers,alternative_titles,credits,external_ids,images,keywords,recommendations,reviews,similar,translations,videos&include_image_language=en`;
        try {
            const req = await this.fetch(this.apiUrl + searchUrl);
            return req.json();
        }
        catch (e) {
            throw new Error(e);
        }
    }
}
exports.default = TMDB;
//# sourceMappingURL=TMDB.js.map