"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = __importDefault(require("."));
class MAL extends _1.default {
    id = "mal";
    url = "https://myanimelist.net";
    statusMap = {
        "not yet aired": "NOT_YET_RELEASED" /* MediaStatus.NOT_YET_RELEASED */,
        "currently airing": "RELEASING" /* MediaStatus.RELEASING */,
        "finished airing": "FINISHED" /* MediaStatus.FINISHED */,
    };
    get priorityArea() {
        return [];
    }
    get sharedArea() {
        return ["synonyms", "genres"];
    }
    async info(media) {
        const malId = media.malId;
        const jikanResponse = await (await fetch(`https://api.jikan.moe/v4/${media.type.toLowerCase()}/${malId}/full`)).json();
        const data = jikanResponse.data;
        if (!data)
            return undefined;
        return {
            title: {
                english: data.title_english ?? null,
                romaji: data.title ?? null,
                native: data.title_japanese ?? null,
            },
            currentEpisode: data.status === "completed" ? data.episodes : null,
            trailer: data.trailer ? data.trailer.url : null,
            coverImage: data.images?.jpg?.image_url ?? null,
            bannerImage: null,
            color: null,
            totalEpisodes: data.episodes ?? 0,
            status: data.status ? this.statusMap[data.status.toLowerCase()] : null,
            popularity: data.popularity,
            synonyms: data.title_synonyms?.filter((s) => s?.length) ?? [],
            season: data.season ? [data.season.toUpperCase()] : "UNKNOWN" /* Season.UNKNOWN */,
            genres: data.genres ? data.genres.map((g) => g.name) : [],
            description: data.synopsis ?? null,
            rating: data.score ?? null,
            year: data.year ?? null,
            duration: data.duration ? Number.parseInt(data.duration.replace("min per ep", "").trim()) : null,
            format: data.type.toUpperCase(),
            countryOfOrigin: null,
            tags: [],
        };
    }
}
exports.default = MAL;
