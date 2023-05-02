"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEntry = void 0;
const database_1 = require("database");
const event_1 = __importStar(require("@/src/helper/event"));
const createEntry = async (data) => {
    const existing = data.type === "ANIME" /* Type.ANIME */ ? await database_1.prisma.anime.findUnique({ where: {
            id: String(data.toInsert.id)
        } }) : await database_1.prisma.manga.findUnique({ where: {
            id: String(data.toInsert.id)
        } });
    if (existing) {
        await event_1.default.emitAsync(event_1.Events.COMPLETED_ENTRY_CREATION, data.toInsert.id);
        return existing;
    }
    data.type === "ANIME" /* Type.ANIME */ ? await database_1.prisma.anime.create({
        data: {
            id: String(data.toInsert.id),
            title: data.toInsert.title,
            kitsuId: data.toInsert.kitsuId ?? "",
            malId: String(data.toInsert.malId),
            popularity: data.toInsert.popularity,
            rating: data.toInsert.rating,
            slug: data.toInsert.slug,
            type: data.toInsert.type,
            bannerImage: data.toInsert.bannerImage,
            color: data.toInsert.color,
            countryOfOrigin: data.toInsert.countryOfOrigin,
            coverImage: data.toInsert.coverImage,
            // @ts-ignore
            currentEpisode: data.toInsert.currentEpisode,
            description: data.toInsert.description,
            // @ts-ignore
            duration: data.toInsert.duration,
            format: data.toInsert.format,
            genres: data.toInsert.genres,
            mappings: data.toInsert.mappings,
            relations: data.toInsert.relations,
            // @ts-ignore
            season: data.toInsert.season,
            status: data.toInsert.status,
            synonyms: data.toInsert.synonyms,
            tags: data.toInsert.tags,
            // @ts-ignore
            totalEpisodes: data.toInsert.totalEpisodes,
            // @ts-ignore
            trailer: data.toInsert.trailer,
            // @ts-ignore
            year: data.toInsert.year,
        }
    }) : await database_1.prisma.manga.create({
        data: {
            id: String(data.toInsert.id),
            title: data.toInsert.title,
            kitsuId: data.toInsert.kitsuId ?? "",
            malId: String(data.toInsert.malId),
            popularity: data.toInsert.popularity,
            rating: data.toInsert.rating,
            slug: data.toInsert.slug,
            type: data.toInsert.type,
            bannerImage: data.toInsert.bannerImage,
            color: data.toInsert.color,
            countryOfOrigin: data.toInsert.countryOfOrigin,
            coverImage: data.toInsert.coverImage,
            // @ts-ignore
            totalChapters: data.toInsert.totalChapters,
            // @ts-ignore
            totalVolumes: data.toInsert.totalVolumes,
            description: data.toInsert.description,
            format: data.toInsert.format,
            genres: data.toInsert.genres,
            mappings: data.toInsert.mappings,
            relations: data.toInsert.relations,
            status: data.toInsert.status,
            synonyms: data.toInsert.synonyms,
            tags: data.toInsert.tags,
        }
    });
    await event_1.default.emitAsync(event_1.Events.COMPLETED_ENTRY_CREATION, data.toInsert.id);
    return data.toInsert;
};
exports.createEntry = createEntry;
