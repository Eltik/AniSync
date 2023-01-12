"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const API_1 = require("./API");
const StringSimilarity_1 = require("./libraries/StringSimilarity");
const config_1 = require("./config");
const AniList_1 = require("./providers/meta/AniList");
const TMDB_1 = require("./providers/meta/TMDB");
const ComicK_1 = require("./providers/manga/ComicK");
const MangaDex_1 = require("./providers/manga/MangaDex");
const Mangakakalot_1 = require("./providers/manga/Mangakakalot");
const GogoAnime_1 = require("./providers/anime/GogoAnime");
const AnimeFox_1 = require("./providers/anime/AnimeFox");
const AnimePahe_1 = require("./providers/anime/AnimePahe");
const Enime_1 = require("./providers/anime/Enime");
const Zoro_1 = require("./providers/anime/Zoro");
const CrunchyRoll_1 = require("./providers/anime/CrunchyRoll");
class AniSync extends API_1.default {
    constructor() {
        super(API_1.ProviderType.NONE);
        this.stringSim = new StringSimilarity_1.default();
        this.classDictionary = [];
        this.crunchyroll = new CrunchyRoll_1.default();
        const tmdb = new TMDB_1.default();
        const comicK = new ComicK_1.default();
        const mangadex = new MangaDex_1.default();
        const mangakakalot = new Mangakakalot_1.default();
        const gogoAnime = new GogoAnime_1.default();
        const animeFox = new AnimeFox_1.default();
        const animePahe = new AnimePahe_1.default();
        const enime = new Enime_1.default();
        const zoro = new Zoro_1.default();
        // Loop through config to set class dictionary
        this.classDictionary = [
            {
                name: tmdb.providerName,
                object: tmdb
            },
            {
                name: comicK.providerName,
                object: comicK
            },
            {
                name: mangadex.providerName,
                object: mangadex
            },
            {
                name: mangakakalot.providerName,
                object: mangakakalot
            },
            {
                name: gogoAnime.providerName,
                object: gogoAnime
            },
            {
                name: animeFox.providerName,
                object: animeFox
            },
            {
                name: animePahe.providerName,
                object: animePahe
            },
            {
                name: enime.providerName,
                object: enime
            },
            {
                name: zoro.providerName,
                object: zoro
            },
            {
                name: this.crunchyroll.providerName,
                object: this.crunchyroll
            }
        ];
    }
    // You want to search the database first, but since that hasn't been setup yet, we'll just search the providers.
    async search(query, type) {
        const promises = [];
        if (type === "ANIME") {
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
            promises.push(aniListPromise);
            await Promise.all(promises);
            // Search AniList first, then search the other providers.
            const possibleData = await this.searchAnimeData(aniData);
            if (possibleData.length > 0) {
                return possibleData;
            }
            const aggregatorData = await this.fetchData(query, type).catch((err) => {
                console.error(err);
                return [];
            });
            const comparison = [];
            aggregatorData.map((result, index) => {
                const provider = result.provider_name;
                const results = result.results;
                for (let i = 0; i < results.length; i++) {
                    const data = this.compareAnime(results[i], aniData, config_1.config.mapping.provider[provider]?.threshold, config_1.config.mapping.provider[provider]?.comparison_threshold);
                    if (data != undefined) {
                        comparison.push({
                            provider,
                            data
                        });
                    }
                }
            });
            const result = this.formatData(comparison);
            return result;
        }
        else if (type === "MANGA") {
            const aniData = [null];
            // Most likely will have to change MANGA to ONE_SHOT as well.
            const aniList = new AniList_1.default("", type, "MANGA");
            const aniListPromise = new Promise((resolve, reject) => {
                aniList.search(query).then((result) => {
                    const data = result.data.Page.media;
                    aniData.push(...data);
                    resolve(aniData);
                });
            });
            promises.push(aniListPromise);
            await Promise.all(promises);
            // Search AniList first, then search the other providers.
            const possibleData = await this.searchMangaData(aniData);
            if (possibleData.length > 0) {
                return possibleData;
            }
            const aggregatorData = await this.fetchData(query, type).catch((err) => {
                console.error(err);
                return [];
            });
            const comparison = [];
            aggregatorData.map((result, index) => {
                const provider = result.provider_name;
                const results = result.results;
                for (let i = 0; i < results.length; i++) {
                    const data = this.compareAnime(results[i], aniData, config_1.config.mapping.provider[provider]?.threshold, config_1.config.mapping.provider[provider]?.comparison_threshold);
                    if (data != undefined) {
                        comparison.push({
                            provider,
                            data
                        });
                    }
                }
            });
            const result = this.formatData(comparison);
            return result;
        }
        else {
            throw new Error("Invalid type. Valid types include ANIME and MANGA.");
        }
    }
    async crawl(type, start, maxPages, wait) {
        maxPages = maxPages ? maxPages : config_1.config.crawling.anime.max_pages;
        wait = wait ? wait : config_1.config.crawling.anime.wait;
        start = start ? start : config_1.config.crawling.anime.start;
        if (type === "ANIME") {
            let canCrawl = true;
            const aniList = new AniList_1.default("", type, "TV");
            const anime = new Zoro_1.default();
            for (let i = start; i < maxPages && canCrawl; i++) {
                if (config_1.config.crawling.debug) {
                    console.log("Crawling page " + i + "...");
                }
                const aniListData = await aniList.getSeasonal(i, 10, type);
                const aniListMedia = aniListData.data.trending.media;
                if (!aniListMedia || aniListMedia.length === 0) {
                    console.log("No more data to crawl.");
                    canCrawl = false;
                }
                const debugTimer = new Date(Date.now());
                if (config_1.config.crawling.debug) {
                    console.log("Fetching seasonal data...");
                }
                const data = await this.fetchCrawlData(aniListMedia, type);
                if (config_1.config.crawling.debug) {
                    const endTimer = new Date(Date.now());
                    console.log("Finished fetching data. Request took " + (endTimer.getTime() - debugTimer.getTime()) + " milliseconds.");
                }
                await anime.insert(data);
                if (config_1.config.crawling.debug) {
                    console.log("Finished inserting shows.");
                }
                await this.wait(wait);
            }
            console.log("Finished crawling!");
        }
        else {
            const aniList = new AniList_1.default("", type, "MANGA");
            const manga = new ComicK_1.default();
            for (let i = 0; i < maxPages; i++) {
                if (config_1.config.crawling.debug) {
                    console.log("Crawling page " + i + ".");
                }
                const aniListData = await aniList.getSeasonal(i, 10, type);
                const aniListMedia = aniListData.data.trending.media;
                const debugTimer = new Date(Date.now());
                if (config_1.config.crawling.debug) {
                    console.log("Fetching seasonal data...");
                }
                const data = await this.getSeasonal(aniListMedia, type);
                if (config_1.config.crawling.debug) {
                    const endTimer = new Date(Date.now());
                    console.log("Finished fetching data. Request took " + (endTimer.getTime() - debugTimer.getTime()) + " milliseconds.");
                }
                await manga.insert(data);
                if (config_1.config.crawling.debug) {
                    console.log("Finished inserting shows.");
                }
                await this.wait(wait);
            }
        }
    }
    async getTrending(type) {
        if (type === "ANIME") {
            // Most likely will have to change TV to MOVIE, OVA, etc.
            const aniList = new AniList_1.default("", type, "TV");
            const data = await aniList.getSeasonal();
            const trending = data.data.trending.media;
            const trendingData = await this.getSeasonal(trending, type);
            return trendingData;
        }
        else {
            // Most likely will have to change TV to MOVIE, OVA, etc.
            const aniList = new AniList_1.default("", type, "MANGA");
            const data = await aniList.getSeasonal();
            const trending = data.data.trending.media;
            const trendingData = await this.getSeasonal(trending, type);
            return trendingData;
        }
    }
    async getSeason(type) {
        if (type === "ANIME") {
            // Most likely will have to change TV to MOVIE, OVA, etc.
            const aniList = new AniList_1.default("", type, "TV");
            const data = await aniList.getSeasonal();
            const season = data.data.season.media;
            const seasonData = await this.getSeasonal(season, type);
            return seasonData;
        }
        else {
            // Most likely will have to change TV to MOVIE, OVA, etc.
            const aniList = new AniList_1.default("", type, "MANGA");
            const data = await aniList.getSeasonal();
            const season = data.data.season.media;
            const seasonData = await this.getSeasonal(season, type);
            return seasonData;
        }
    }
    async getPopular(type) {
        if (type === "ANIME") {
            // Most likely will have to change TV to MOVIE, OVA, etc.
            const aniList = new AniList_1.default("", type, "TV");
            const data = await aniList.getSeasonal();
            const popular = data.data.popular.media;
            const popularData = await this.getSeasonal(popular, type);
            return popularData;
        }
        else {
            // Most likely will have to change TV to MOVIE, OVA, etc.
            const aniList = new AniList_1.default("", type, "MANGA");
            const data = await aniList.getSeasonal();
            const popular = data.data.popular.media;
            const popularData = await this.getSeasonal(popular, type);
            return popularData;
        }
    }
    async getTop(type) {
        if (type === "ANIME") {
            // Most likely will have to change TV to MOVIE, OVA, etc.
            const aniList = new AniList_1.default("", type, "TV");
            const data = await aniList.getSeasonal();
            const top = data.data.top.media;
            const topData = await this.getSeasonal(top, type);
            return topData;
        }
        else {
            // Most likely will have to change TV to MOVIE, OVA, etc.
            const aniList = new AniList_1.default("", type, "MANGA");
            const data = await aniList.getSeasonal();
            const top = data.data.top.media;
            const topData = await this.getSeasonal(top, type);
            return topData;
        }
    }
    async getNextSeason(type) {
        // WILL MOST LIKELY HAVE NO RESULTS
        if (type === "ANIME") {
            // Most likely will have to change TV to MOVIE, OVA, etc.
            const aniList = new AniList_1.default("", type, "TV");
            const data = await aniList.getSeasonal();
            const nextSeason = data.data.nextSeason.media;
            const nextData = await this.getSeasonal(nextSeason, type);
            return nextData;
        }
        else {
            // Most likely will have to change TV to MOVIE, OVA, etc.
            const aniList = new AniList_1.default("", type, "MANGA");
            const data = await aniList.getSeasonal();
            const nextSeason = data.data.nextSeason.media;
            const nextData = await this.getSeasonal(nextSeason, type);
            return nextData;
        }
    }
    async get(id) {
        const anime = new Zoro_1.default();
        const manga = new ComicK_1.default();
        let possible = await anime.get(id);
        if (!possible) {
            possible = await manga.get(id);
        }
        return possible;
    }
    async fetchCrawlData(season, type) {
        if (type === "ANIME") {
            const seasonData = [];
            const allSeason = [];
            const promises = [];
            for (let i = 0; i < season.length; i++) {
                const promise = new Promise(async (resolve, reject) => {
                    const aniData = season[i];
                    const possible = await this.getShow(String(aniData.id));
                    if (!possible) {
                        const title = aniData.title.english;
                        const aggregatorData = await this.fetchData(title, type).catch((err) => {
                            console.error(err);
                            return [];
                        });
                        aggregatorData.map((result, index) => {
                            const provider = result.provider_name;
                            const results = result.results;
                            for (let i = 0; i < results.length; i++) {
                                const data = this.compareAnime(results[i], [aniData], config_1.config.mapping.provider[provider]?.threshold, config_1.config.mapping.provider[provider]?.comparison_threshold);
                                if (data != undefined) {
                                    seasonData.push({
                                        provider,
                                        data
                                    });
                                }
                            }
                        });
                        resolve(true);
                    }
                    else {
                        allSeason.push(possible);
                        resolve(true);
                    }
                });
                promises.push(promise);
            }
            await Promise.all(promises);
            const formatted = this.formatData(seasonData);
            allSeason.push(...formatted);
            return allSeason;
        }
        else {
            const seasonData = [];
            const allSeason = [];
            const promises = [];
            for (let i = 0; i < season.length; i++) {
                const promise = new Promise(async (resolve, reject) => {
                    const aniData = season[i];
                    const possible = await this.getManga(String(aniData.id));
                    if (!possible) {
                        const title = aniData.title.english;
                        const aggregatorData = await this.fetchData(title, type).catch((err) => {
                            console.error(err);
                            return [];
                        });
                        aggregatorData.map((result, index) => {
                            const provider = result.provider_name;
                            const results = result.results;
                            for (let i = 0; i < results.length; i++) {
                                const data = this.compareAnime(results[i], [aniData], config_1.config.mapping.provider[provider]?.threshold, config_1.config.mapping.provider[provider]?.comparison_threshold);
                                if (data != undefined) {
                                    seasonData.push({
                                        provider,
                                        data
                                    });
                                }
                            }
                        });
                    }
                    else {
                        allSeason.push(possible);
                    }
                });
                promises.push(promise);
            }
            await Promise.all(promises);
            const formatted = this.formatData(seasonData);
            allSeason.push(...formatted);
            return allSeason;
        }
    }
    async getSeasonal(season, type) {
        if (type === "ANIME") {
            const seasonData = [];
            const allSeason = [];
            const possibleTrending = await this.searchAnimeData(season);
            if (possibleTrending.length > 0) {
                allSeason.push(...possibleTrending);
            }
            else {
                for (let i = 0; i < season.length; i++) {
                    const aniData = season[i];
                    const title = aniData.title.english;
                    const aggregatorData = await this.fetchData(title, type).catch((err) => {
                        console.error(err);
                        return [];
                    });
                    aggregatorData.map((result, index) => {
                        const provider = result.provider_name;
                        const results = result.results;
                        for (let i = 0; i < results.length; i++) {
                            const data = this.compareAnime(results[i], [aniData], config_1.config.mapping.provider[provider]?.threshold, config_1.config.mapping.provider[provider]?.comparison_threshold);
                            if (data != undefined) {
                                seasonData.push({
                                    provider,
                                    data
                                });
                            }
                        }
                    });
                }
                const formatted = this.formatData(seasonData);
                allSeason.push(...formatted);
            }
            return allSeason;
        }
        else {
            const seasonData = [];
            const allSeason = [];
            const possibleTrending = await this.searchMangaData(season);
            if (possibleTrending.length > 0) {
                allSeason.push(...possibleTrending);
            }
            else {
                for (let i = 0; i < season.length; i++) {
                    const aniData = season[i];
                    const title = aniData.title.english;
                    const aggregatorData = await this.fetchData(title, type).catch((err) => {
                        console.error(err);
                        return [];
                    });
                    aggregatorData.map((result, index) => {
                        const provider = result.provider_name;
                        const results = result.results;
                        for (let i = 0; i < results.length; i++) {
                            const data = this.compareAnime(results[i], [aniData], config_1.config.mapping.provider[provider]?.threshold, config_1.config.mapping.provider[provider]?.comparison_threshold);
                            if (data != undefined) {
                                seasonData.push({
                                    provider,
                                    data
                                });
                            }
                        }
                    });
                }
                const formatted = this.formatData(seasonData);
                allSeason.push(...formatted);
            }
            return allSeason;
        }
    }
    async fetchData(query, type) {
        const promises = [];
        const aggregatorData = [];
        for (let i = 0; i < this.classDictionary.length; i++) {
            const provider = this.classDictionary[i].object;
            const name = this.classDictionary[i].name;
            const promise = new Promise((resolve, reject) => {
                if (!config_1.config.mapping.provider[name].disabled) {
                    if (type === provider.providerType) {
                        this.wait(config_1.config.mapping.provider[name] ? config_1.config.mapping.provider[name].wait : config_1.config.mapping.wait).then(async () => {
                            if (name === this.crunchyroll.providerName) {
                                if (!this.crunchyroll.hasInit) {
                                    await this.crunchyroll.init();
                                }
                            }
                            const parsedQuery = this.getPartialQuery(query, config_1.config.mapping.provider[name].search_partial ? config_1.config.mapping.provider[name].partial_amount : 1);
                            provider.search(parsedQuery).then((results) => {
                                console.log(name + " got " + results.length + " from query " + parsedQuery + ".");
                                aggregatorData.push({
                                    provider_name: name,
                                    results: results
                                });
                                resolve(aggregatorData);
                            }).catch((err) => {
                                reject(err);
                            });
                        });
                    }
                    else {
                        resolve(true);
                    }
                }
                else {
                    resolve(true);
                }
            });
            promises.push(promise);
        }
        await Promise.all(promises);
        return aggregatorData;
    }
    getPartialQuery(query, partialAmount) {
        const split = query.split(" ");
        const splitLength = split.length;
        const maxIndex = Math.floor(splitLength * partialAmount);
        let newQuery = "";
        for (let j = 0; j < maxIndex; j++) {
            const word = query.split(" ")[j];
            newQuery += newQuery.length === 0 ? word : " " + word;
        }
        return newQuery;
    }
    // Formats search results into singular AniList data. Assigns each provider to an AniList object.
    formatData(results) {
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
    checkItem(result1, result2, threshold) {
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
            if (result1.title === result2.title || stringComparison > threshold) {
                amount++;
            }
        }
        if (result1.romaji != undefined && result2.romaji != undefined) {
            tries++;
            const stringComparison = this.stringSim.compareTwoStrings(result1.romaji, result2.romaji);
            if (result1.romaji === result2.romaji || stringComparison > threshold) {
                amount++;
            }
        }
        if (result1.native != undefined && result2.native != undefined) {
            tries++;
            const stringComparison = this.stringSim.compareTwoStrings(result1.native, result2.native);
            if (result1.native === result2.native || stringComparison > threshold) {
                amount++;
            }
        }
        return amount / tries;
    }
    compareAnime(anime, aniList, threshold, comparison_threshold) {
        threshold = threshold ? threshold : config_1.config.mapping.threshold;
        comparison_threshold = comparison_threshold ? comparison_threshold : config_1.config.mapping.comparison_threshold;
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
            const comparison = this.checkItem(map1, map2, threshold);
            if (comparison > comparison_threshold) {
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
    async getShow(id) {
        const anime = new Zoro_1.default();
        const data = await anime.get(id);
        return data;
    }
    async getManga(id) {
        const manga = new ComicK_1.default();
        const data = await manga.get(id);
        return data;
    }
    async searchAnimeData(aniListData) {
        const promises = [];
        const results = [];
        const anime = new Zoro_1.default();
        for (let i = 0; i < aniListData.length; i++) {
            const id = aniListData[i] ? aniListData[i].id : undefined;
            if (id != undefined) {
                const promise = new Promise(async (resolve, reject) => {
                    const data = await anime.get(String(id));
                    if (data != null) {
                        results.push(data);
                    }
                    resolve(true);
                });
                promises.push(promise);
            }
        }
        await Promise.all(promises);
        return results;
    }
    async searchMangaData(aniListData) {
        const promises = [];
        const results = [];
        const manga = new ComicK_1.default();
        for (let i = 0; i < aniListData.length; i++) {
            const id = aniListData[i] ? aniListData[i].id : undefined;
            if (id != undefined) {
                const promise = new Promise(async (resolve, reject) => {
                    const data = await manga.get(String(id));
                    if (data != null) {
                        results.push(data);
                    }
                    resolve(true);
                });
                promises.push(promise);
            }
        }
        await Promise.all(promises);
        return results;
    }
}
exports.default = AniSync;
//# sourceMappingURL=AniSync.js.map