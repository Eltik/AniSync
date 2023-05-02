"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const _1 = __importDefault(require("."));
class Kitsu extends _1.default {
    id = "kitsu";
    url = "https://kitsu.io";
    kitsuApiUrl = "https://kitsu.io/api/edge";
    get priorityArea() {
        return ["coverImage"];
    }
    get sharedArea() {
        return ["synonyms", "genres"];
    }
    async info(media) {
        const kitsuId = media.kitsuId;
        if (!kitsuId || kitsuId.length === 0)
            return undefined;
        const kitsuResponse = await (await (0, axios_1.default)(`${this.kitsuApiUrl}/${media.type.toLowerCase()}/${kitsuId}`)).data;
        const attributes = kitsuResponse?.data?.attributes;
        if (!attributes)
            return undefined;
        const kitsuGenre = await (await (0, axios_1.default)(`${this.kitsuApiUrl}/${media.type.toLowerCase()}/${kitsuId}/genres`)).data;
        const genres = kitsuGenre?.data;
        return {
            title: {
                english: attributes.titles.en ?? null,
                romaji: attributes.titles.en_jp ?? null,
                native: attributes.titles.ja_jp ?? null
            },
            currentEpisode: null,
            trailer: null,
            duration: attributes.episodeLength ?? null,
            color: null,
            bannerImage: attributes.coverImage?.original ?? null,
            coverImage: attributes.posterImage?.original ?? null,
            status: null,
            format: "UNKNOWN" /* Format.UNKNOWN */,
            season: "UNKNOWN" /* Season.UNKNOWN */,
            synonyms: [],
            description: attributes.synopsis ?? null,
            year: null,
            totalEpisodes: attributes.episodeCount ?? 0,
            genres: genres ? genres.map(genre => genre.attributes.name) : [],
            rating: attributes.averageRating ? Number.parseFloat((Number.parseFloat(attributes.averageRating) / 10).toFixed(2)) : null,
            popularity: null,
            countryOfOrigin: null,
            tags: []
        };
    }
}
exports.default = Kitsu;
