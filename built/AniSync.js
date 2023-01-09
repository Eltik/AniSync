"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const API_1 = require("./API");
const StringSimilarity_1 = require("./StringSimilarity");
const config_1 = require("./config");
const ZoroTo_1 = require("./providers/anime/ZoroTo");
const CrunchyRoll_1 = require("./providers/anime/CrunchyRoll");
const AniList_1 = require("./AniList");
class AniSync extends API_1.default {
    constructor() {
        super();
        this.stringSim = new StringSimilarity_1.default();
        this.config = config_1.config.mapping;
    }
    // You want to search the database first, but since that hasn't been setup yet, we'll just search the providers.
    async search(query, type) {
        const promises = [];
        if (type === "ANIME") {
            const zoro = new ZoroTo_1.default();
            const crunchy = new CrunchyRoll_1.default();
            const aggregatorData = [];
            const aniData = [null];
            // Most likely will have to change TV to MOVIE, OVA, etc.
            const aniList = new AniList_1.default("", type, "TV");
            const aniListPromise = new Promise((resolve, reject) => {
                aniList.search(query).then((result) => {
                    const data = result.data.Page.media;
                    aniData.push(...data);
                    resolve(aniData);
                });
            });
            const zoroPromise = new Promise((resolve, reject) => {
                zoro.search(query).then((results) => {
                    aggregatorData.push({
                        provider_name: zoro.providerName,
                        results: results
                    });
                    resolve(aggregatorData);
                }).catch((err) => {
                    reject(err);
                });
            });
            const crunchyPromise = new Promise((resolve, reject) => {
                crunchy.init().then(() => {
                    crunchy.search(query).then((results) => {
                        aggregatorData.push({
                            provider_name: crunchy.providerName,
                            results: results
                        });
                        resolve(aggregatorData);
                    }).catch((err) => {
                        reject(err);
                    });
                });
            });
            promises.push(aniListPromise);
            promises.push(zoroPromise);
            promises.push(crunchyPromise);
            await Promise.all(promises);
            const comparison = [];
            aggregatorData.map((result, index) => {
                const provider = result.provider_name;
                const results = result.results;
                for (let i = 0; i < results.length; i++) {
                    const data = this.compareAnime(results[i], aniData);
                    if (data != undefined) {
                        comparison.push({
                            provider,
                            data
                        });
                    }
                }
            });
            const result = this.formatAnimeData(comparison);
            return result;
        }
        else {
            throw new Error("Manga is not supported yet.");
        }
    }
    async crawl() {
        throw new Error("Not implemented yet.");
    }
    async insertAnime(results) {
        // CREATE TABLE anime(id int(7) NOT NULL, mal int(7) default 0, anilist longtext not null, connectors longtext not null);
    }
    // Formats search results into singular AniList data. Assigns each provider to an AniList object.
    formatAnimeData(results) {
        const aniList = [];
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            const provider = result.provider;
            const data = result.data;
            let media = data.media;
            let canPush = true;
            let index = -1;
            for (let j = 0; j < aniList.length; j++) {
                if (aniList[j].id === media.id) {
                    canPush = false;
                    media = aniList[j];
                    index = j;
                }
            }
            if (canPush) {
                aniList.push({
                    id: media.id,
                    anilist: media,
                    connectors: [{ provider: provider, data: result.data.result, comparison: result.data.comparison }]
                });
            }
            else {
                const aniListData = media.anilist;
                const formatted = {
                    id: media.id,
                    anilist: aniListData,
                    connectors: [...aniList[index].connectors, { provider: provider, data: result.data.result, comparison: result.data.comparison }]
                };
                aniList[index] = formatted;
            }
        }
        return aniList;
    }
    checkItem(result1, result2) {
        let amount = 0;
        let tries = 0;
        result1.title = result1.title != undefined ? result1.title.toLowerCase() : undefined;
        result1.romaji = result1.romaji != undefined ? result1.romaji.toLowerCase() : undefined;
        result1.native = result1.native != undefined ? result1.native.toLowerCase() : undefined;
        result2.title = result2.title != undefined ? result2.title.toLowerCase() : undefined;
        result2.romaji = result2.romaji != undefined ? result2.romaji.toLowerCase() : undefined;
        result2.native = result2.native != undefined ? result2.native.toLowerCase() : undefined;
        // Check title
        if (result1.title != undefined && result2.title != undefined) {
            tries++;
            const stringComparison = this.stringSim.compareTwoStrings(result1.title, result2.title);
            if (result1.title === result2.title || stringComparison > this.config.threshold) {
                amount++;
            }
        }
        if (result1.romaji != undefined && result2.romaji != undefined) {
            tries++;
            const stringComparison = this.stringSim.compareTwoStrings(result1.romaji, result2.romaji);
            if (result1.romaji === result2.romaji || stringComparison > this.config.threshold) {
                amount++;
            }
        }
        if (result1.native != undefined && result2.native != undefined) {
            tries++;
            const stringComparison = this.stringSim.compareTwoStrings(result1.native, result2.native);
            if (result1.native === result2.native || stringComparison > this.config.threshold) {
                amount++;
            }
        }
        // Check genres
        /*
        if (this.config.check_genres) {
            if (result1.genres.length === result2.genres.length) {
                matches = false;
            } else {
                for (let i = 0; i < result1.genres.length; i++) {
                    if (result1.genres[i] != result2.genres[i] && this.stringSim.compareTwoStrings(result1.genres[i], result2.genres[i]) < this.config.threshold) {
                        matches = false;
                    }
                }
            }
        }
        */
        return amount / tries;
    }
    compareAnime(anime, aniList) {
        const result = [];
        for (let i = 0; i < aniList.length; i++) {
            const media = aniList[i];
            if (!media) {
                continue;
            }
            const map1 = {
                title: anime.title,
                romaji: anime.romaji,
                native: anime.native
            };
            const map2 = {
                title: media.title.english,
                romaji: media.title.romaji,
                native: media.title.native
            };
            const comparison = this.checkItem(map1, map2);
            if (comparison > this.config.comparison_threshold) {
                result.push({
                    result: anime,
                    media,
                    comparison
                });
            }
        }
        // It is possible that there are multiple results, so we need to sort them. But generally, there should only be one result.
        return result[0];
    }
}
exports.default = AniSync;
//# sourceMappingURL=AniSync.js.map