"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const _1 = __importDefault(require("."));
const helper_1 = require("@/src/helper");
const fs_1 = require("fs");
const path_1 = require("path");
const promises_1 = require("fs/promises");
const colors_1 = __importDefault(require("colors"));
class AniList extends _1.default {
    id = "anilist";
    url = "https://anilist.co";
    api = "https://graphql.anilist.co";
    get priorityArea() {
        return ["bannerImage"];
    }
    get sharedArea() {
        return ["synonyms", "genres", "tags"];
    }
    async search(query, type, formats, page, perPage) {
        // First try manami-project
        const possible = await this.fetchManamiProject(query, type, formats);
        if (possible.length > 0 && type === "ANIME" /* Type.ANIME */) {
            const data = possible.map((media) => {
                const sources = media.sources;
                const aniList = sources.find((source) => {
                    // Try and parse AniList link
                    const url = new URL(source);
                    if (url.href.includes(this.url)) {
                        return true;
                    }
                });
                const mal = sources.find((source) => {
                    // Try and parse AniList link
                    const url = new URL(source);
                    if (url.href.includes("https://myanimelist.net")) {
                        return true;
                    }
                });
                if (!aniList) {
                    return null;
                }
                return {
                    aniListId: aniList ? aniList.split("/anime/")[1] : null,
                    malId: mal ? mal.split("/anime/")[1] : null,
                    title: {
                        english: media.title,
                        romaji: null,
                        native: null
                    },
                    trailer: null,
                    currentEpisode: (media.status === "FINISHED" /* MediaStatus.FINISHED */ || media.status === "CANCELLED" /* MediaStatus.CANCELLED */) ? (media.episodes ?? 0) : 0,
                    duration: null,
                    coverImage: media.picture ?? null,
                    bannerImage: null,
                    popularity: 0,
                    synonyms: media.synonyms ?? [],
                    totalEpisodes: media.episodes ?? 0,
                    color: null,
                    status: media.status,
                    season: media.animeSeason.season,
                    genres: [],
                    rating: null,
                    description: null,
                    format: media.type,
                    year: media.animeSeason.year ?? null,
                    type: type,
                    countryOfOrigin: null,
                    tags: media.tags
                };
            });
            if (data.filter((media) => media !== null).length > 0) {
                return data.filter((media) => media !== null);
            }
        }
        const aniListArgs = {
            query: `
            query($page: Int, $perPage: Int, $search: String, $type: MediaType, $format: [MediaFormat]) {
                Page(page: $page, perPage: $perPage) {
                    pageInfo {
                        total
                        currentPage
                        lastPage
                        hasNextPage
                        perPage
                    }
                    media(type: $type, format_in: $format, search: $search) {
                        ${this.query}
                    }
                }
            }
            `,
            variables: {
                search: query,
                type: type,
                format: formats,
                page: page ? page : 0,
                perPage: perPage ? perPage : 15
            }
        };
        const req = await this.request(this.api, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            data: aniListArgs
        });
        if (!req) {
            return undefined;
        }
        const media = req?.data.data.Page.media;
        if (type === "ANIME" /* Type.ANIME */) {
            return media.map((data) => {
                return {
                    aniListId: data.id,
                    malId: data.idMal,
                    title: {
                        english: data.title.english ?? null,
                        romaji: data.title.romaji ?? null,
                        native: data.title.native ?? null
                    },
                    trailer: null,
                    currentEpisode: (data.status === "FINISHED" /* MediaStatus.FINISHED */ || data.status === "CANCELLED" /* MediaStatus.CANCELLED */) ? (data.episodes ?? 0) : 0,
                    duration: data.duration ?? null,
                    coverImage: data.coverImage.extraLarge ?? null,
                    bannerImage: data.bannerImage ?? null,
                    popularity: Number(data.popularity),
                    synonyms: data.synonyms ?? [],
                    totalEpisodes: data.episodes ?? 0,
                    color: null,
                    status: data.status,
                    season: data.season,
                    genres: data.genres ?? [],
                    rating: data.meanScore ? data.meanScore / 10 : null,
                    description: data.description ?? null,
                    format: data.format,
                    year: data.seasonYear ?? null,
                    // @ts-ignore
                    type: data.type,
                    countryOfOrigin: data.countryOfOrigin ?? null,
                    tags: data.tags
                };
            });
        }
        else {
            return media.map((data) => {
                return {
                    aniListId: data.id,
                    malId: data.idMal,
                    title: {
                        english: data.title.english ?? null,
                        romaji: data.title.romaji ?? null,
                        native: data.title.native ?? null
                    },
                    coverImage: data.coverImage.extraLarge ?? null,
                    bannerImage: data.bannerImage ?? null,
                    popularity: Number(data.popularity),
                    synonyms: data.synonyms ?? [],
                    totalChapters: data.chapters ?? 0,
                    totalVolumes: data.volumes ?? 0,
                    color: null,
                    status: data.status,
                    genres: data.genres ?? [],
                    rating: data.meanScore ? data.meanScore / 10 : null,
                    description: data.description ?? null,
                    format: data.format,
                    // @ts-ignore
                    type: data.type,
                    countryOfOrigin: data.countryOfOrigin ?? null,
                    tags: data.tags.map((tag) => tag.name)
                };
            });
        }
    }
    async info(media) {
        const anilistId = media.id;
        const query = `query ($id: Int) {
            Media (id: $id) {
                ${this.query}
            }
        }`;
        const variables = {
            id: anilistId
        };
        const req = await this.request(this.api, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            data: {
                query,
                variables
            }
        });
        if (!req) {
            return undefined;
        }
        const data = req.data.data.Media;
        return {
            title: {
                english: data.title.english ?? null,
                romaji: data.title.romaji ?? null,
                native: data.title.native ?? null
            },
            trailer: null,
            currentEpisode: (data.status === "FINISHED" /* MediaStatus.FINISHED */ || data.status === "CANCELLED" /* MediaStatus.CANCELLED */) ? (data.episodes ?? 0) : 0,
            duration: data.duration ?? null,
            coverImage: data.coverImage.extraLarge ?? null,
            bannerImage: data.bannerImage ?? null,
            popularity: Number(data.popularity),
            synonyms: data.synonyms ?? [],
            totalEpisodes: data.episodes ?? 0,
            totalChapters: data.chapters ?? 0,
            totalVolumes: data.volumes ?? 0,
            color: null,
            status: data.status,
            season: data.season,
            genres: data.genres ?? [],
            rating: data.meanScore ? data.meanScore / 10 : null,
            description: data.description ?? null,
            format: data.format,
            year: data.seasonYear ?? null,
            countryOfOrigin: data.countryOfOrigin ?? null,
            tags: data.tags.map((tag) => tag.name)
        };
    }
    async getMedia(id) {
        const query = `query ($id: Int) {
            Media (id: $id) {
                ${this.query}
            }
        }`;
        const variables = {
            id: id
        };
        const req = await this.request(this.api, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            data: {
                query,
                variables
            }
        });
        if (!req) {
            return undefined;
        }
        const data = req.data.data.Media;
        return {
            title: {
                english: data.title.english ?? null,
                romaji: data.title.romaji ?? null,
                native: data.title.native ?? null
            },
            trailer: null,
            currentEpisode: (data.status === "FINISHED" /* MediaStatus.FINISHED */ || data.status === "CANCELLED" /* MediaStatus.CANCELLED */) ? (data.episodes ?? 0) : 0,
            duration: data.duration ?? null,
            coverImage: data.coverImage.extraLarge ?? null,
            bannerImage: data.bannerImage ?? null,
            popularity: Number(data.popularity),
            synonyms: data.synonyms ?? [],
            totalEpisodes: data.episodes ?? 0,
            color: null,
            status: data.status,
            season: data.season,
            genres: data.genres ?? [],
            rating: data.meanScore ? data.meanScore / 10 : null,
            description: data.description ?? null,
            format: data.format,
            year: data.seasonYear ?? null,
            // @ts-ignore
            type: data.type,
            countryOfOrigin: data.countryOfOrigin ?? null,
            tags: data.tags.map((tag) => tag.name)
        };
    }
    async fetchSeasonal(type, formats) {
        const aniListArgs = {
            query: `
            query($season: MediaSeason, $seasonYear: Int, $format: [MediaFormat], $page: Int, $perPage: Int, $type: MediaType) {
                trending: Page(page: $page, perPage: $perPage) {
                    media(sort: TRENDING_DESC, type: $type, isAdult: false, format_in: $format) {
                        ...media
                    }
                }
                season: Page(page: $page, perPage: $perPage) {
                    media(season: $season, seasonYear: $seasonYear, sort: POPULARITY_DESC, type: $type, isAdult: false, format_in: $format) {
                        ...media
                    }
                }
                popular: Page(page: $page, perPage: $perPage) {
                    media(sort: POPULARITY_DESC, type: $type, isAdult: false, format_in: $format) {
                        ...media
                    }
                }
                top: Page(page: $page, perPage: $perPage) {
                    media(sort: SCORE_DESC, type: $type, isAdult: false, format_in: $format) {
                        ...media
                    }
                }
            }
            
            fragment media on Media {
                ${this.query}
            }
            `,
            variables: {
                type: type,
                season: "SPRING" /* Season.SPRING */,
                seasonYear: 2023,
                format: formats,
                page: 0,
                perPage: 20
            }
        };
        const req = await this.request(this.api, {
            data: JSON.stringify(aniListArgs),
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            }
        });
        const data = req?.data.data;
        if (!data) {
            return undefined;
        }
        const trending = data.trending.media.map((data) => {
            return {
                aniListId: data.id,
                malId: data.idMal,
                title: {
                    english: data.title.english ?? null,
                    romaji: data.title.romaji ?? null,
                    native: data.title.native ?? null
                },
                coverImage: data.coverImage.extraLarge ?? null,
                bannerImage: data.bannerImage ?? null,
                popularity: Number(data.popularity),
                synonyms: data.synonyms ?? [],
                totalChapters: data.chapters ?? 0,
                totalVolumes: data.volumes ?? 0,
                color: null,
                status: data.status,
                genres: data.genres ?? [],
                rating: data.meanScore ? data.meanScore / 10 : null,
                description: data.description ?? null,
                format: data.format,
                countryOfOrigin: data.countryOfOrigin ?? null,
                // @ts-ignore
                type: data.type,
                tags: data.tags.map((tag) => tag.name)
            };
        });
        const seasonal = data.season.media.map((data) => {
            return {
                aniListId: data.id,
                malId: data.idMal,
                title: {
                    english: data.title.english ?? null,
                    romaji: data.title.romaji ?? null,
                    native: data.title.native ?? null
                },
                coverImage: data.coverImage.extraLarge ?? null,
                bannerImage: data.bannerImage ?? null,
                popularity: Number(data.popularity),
                synonyms: data.synonyms ?? [],
                totalChapters: data.chapters ?? 0,
                totalVolumes: data.volumes ?? 0,
                color: null,
                status: data.status,
                genres: data.genres ?? [],
                rating: data.meanScore ? data.meanScore / 10 : null,
                description: data.description ?? null,
                format: data.format,
                countryOfOrigin: data.countryOfOrigin ?? null,
                // @ts-ignore
                type: data.type,
                tags: data.tags.map((tag) => tag.name)
            };
        });
        const popular = data.popular.media.map((data) => {
            return {
                aniListId: data.id,
                malId: data.idMal,
                title: {
                    english: data.title.english ?? null,
                    romaji: data.title.romaji ?? null,
                    native: data.title.native ?? null
                },
                coverImage: data.coverImage.extraLarge ?? null,
                bannerImage: data.bannerImage ?? null,
                popularity: Number(data.popularity),
                synonyms: data.synonyms ?? [],
                totalChapters: data.chapters ?? 0,
                totalVolumes: data.volumes ?? 0,
                color: null,
                status: data.status,
                genres: data.genres ?? [],
                rating: data.meanScore ? data.meanScore / 10 : null,
                description: data.description ?? null,
                format: data.format,
                countryOfOrigin: data.countryOfOrigin ?? null,
                // @ts-ignore
                type: data.type,
                tags: data.tags.map((tag) => tag.name)
            };
        });
        const top = data.top.media.map((data) => {
            return {
                aniListId: data.id,
                malId: data.idMal,
                title: {
                    english: data.title.english ?? null,
                    romaji: data.title.romaji ?? null,
                    native: data.title.native ?? null
                },
                coverImage: data.coverImage.extraLarge ?? null,
                bannerImage: data.bannerImage ?? null,
                popularity: Number(data.popularity),
                synonyms: data.synonyms ?? [],
                totalChapters: data.chapters ?? 0,
                totalVolumes: data.volumes ?? 0,
                color: null,
                status: data.status,
                genres: data.genres ?? [],
                rating: data.meanScore ? data.meanScore / 10 : null,
                description: data.description ?? null,
                format: data.format,
                countryOfOrigin: data.countryOfOrigin ?? null,
                // @ts-ignore
                type: data.type,
                tags: data.tags.map((tag) => tag.name)
            };
        });
        return {
            trending,
            seasonal,
            popular,
            top
        };
    }
    async fetchManamiProject(query, type, formats) {
        try {
            if ((0, fs_1.existsSync)((0, path_1.join)(__dirname, "./manami.json"))) {
                const data = JSON.parse(await (0, promises_1.readFile)((0, path_1.join)(__dirname, "./manami.json"), "utf-8"));
                if (Date.now() - data.time > 86400000) { // 1 day
                    const { data } = await axios_1.default.get("https://raw.githubusercontent.com/manami-project/anime-offline-database/master/anime-offline-database.json").then((res) => res.data);
                    data.time = Date.now();
                    await (0, promises_1.writeFile)((0, path_1.join)(__dirname, "./manami.json"), JSON.stringify(data, null, 2), "utf-8");
                    console.log(colors_1.default.yellow("Manami Project data has been cached."));
                }
                const results = data.filter((data) => {
                    return data.title.toLowerCase().includes(query.toLowerCase()) || data.synonyms.some((synonym) => synonym.toLowerCase() === query.toLowerCase()) && formats.includes(data.type);
                });
                return results;
            }
            else {
                const { data } = await axios_1.default.get("https://raw.githubusercontent.com/manami-project/anime-offline-database/master/anime-offline-database.json").then((res) => res.data);
                data.time = Date.now();
                await (0, promises_1.writeFile)((0, path_1.join)(__dirname, "./manami.json"), JSON.stringify(data, null, 2), "utf-8");
                console.log(colors_1.default.yellow("Manami Project data has been cached."));
                const results = data.filter((data) => {
                    return data.title.toLowerCase().includes(query.toLowerCase()) || data.synonyms.some((synonym) => synonym.toLowerCase() === query.toLowerCase()) && formats.includes(data.type);
                });
                return results;
            }
        }
        catch (e) {
            console.error(e);
            return [];
        }
    }
    /**
     * @description Custom request function for handling AniList rate limit.
     */
    async request(url, options, retries = 0) {
        const req = await (0, axios_1.default)(url, options).catch((err) => {
            return err;
        });
        const response = req.response ? req.response : req;
        const remainingRequests = parseInt(response?.headers['x-ratelimit-remaining']) || 0;
        const requestLimit = parseInt(response?.headers['x-ratelimit-limit']) || 0;
        const resetTime = parseInt(response?.headers['x-ratelimit-reset']) || 0;
        if (remainingRequests >= 60) {
            const delay = resetTime * 1000 - Date.now();
            if (delay > 0) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
            return await (0, axios_1.default)(url, options).catch((err) => {
                const response = err.response;
                if (!response || response.status === 429) {
                    if (retries < 15) {
                        //console.log(colors.yellow("No rate limit headers found. Waiting..."));
                        return this.request(url, options, retries + 1);
                    }
                    else {
                        throw new Error("Rate limit reached.");
                    }
                }
                else {
                    throw new Error(err);
                }
            });
        }
        if (response.headers['retry-after']) {
            //console.log(colors.yellow("Rate limit headers found. Waiting..."));
            const delay = parseInt(response.headers['retry-after']) * 3000;
            if (delay > 0) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
            return await (0, axios_1.default)(url, options).catch((err) => {
                const response = err.response;
                if (!response || response.status === 429) {
                    if (retries < 15) {
                        //console.log(colors.yellow("No rate limit headers found. Waiting..."));
                        return this.request(url, options, retries + 1);
                    }
                    else {
                        throw new Error("Rate limit reached.");
                    }
                }
                else {
                    throw new Error(err);
                }
            });
        }
        if (response.status === 429) {
            if (retries < 15) {
                //console.log(colors.yellow("No rate limit headers found. Waiting..."));
                await (0, helper_1.wait)(1500);
                return this.request(url, options, retries + 1);
            }
            else {
                return null;
            }
        }
        return response;
    }
    query = `
    id
    idMal
    title {
        romaji
        english
        native
        userPreferred
    }
    coverImage {
        extraLarge
        large
    }
    bannerImage
    startDate {
        year
        month
        day
    }
    endDate {
        year
        month
        day
    }
    description
    season
    seasonYear
    type
    format
    status(version: 2)
    episodes
    duration
    chapters
    volumes
    genres
    synonyms
    source(version: 3)
    isAdult
    meanScore
    averageScore
    popularity
    favourites
    countryOfOrigin
    isLicensed
    airingSchedule {
        edges {
            node {
                airingAt
                timeUntilAiring
                episode
            }
        }
    }
    relations {
        edges {
            id
            relationType(version: 2)
            node {
                id
                title {
                    userPreferred
                }
                format
                type
                status(version: 2)
                bannerImage
                coverImage {
                    large
                }
            }
        }
    }
    characterPreview: characters(perPage: 6, sort: [ROLE, RELEVANCE, ID]) {
        edges {
            id
            role
            name
            voiceActors(language: JAPANESE, sort: [RELEVANCE, ID]) {
                id
                name {
                    userPreferred
                }
                language: languageV2
                image {
                    large
                }
            }
            node {
                id
                name {
                    userPreferred
                }
                image {
                    large
                }
            }
        }
    }
    studios {
        edges {
            isMain
            node {
                id
                name
            }
        }
    }
    streamingEpisodes {
        title
        thumbnail
        url
    }
    trailer {
        id
        site
    }
    tags {
        id
        name
    }
    `;
}
exports.default = AniList;
;
