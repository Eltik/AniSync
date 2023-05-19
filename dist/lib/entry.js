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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEntry = void 0;
const database_1 = require("../database");
const event_1 = __importStar(require("../helper/event"));
const colors_1 = __importDefault(require("colors"));
const createEntry = async (data) => {
    const existing = data.type === "ANIME" /* Type.ANIME */
        ? await database_1.prisma.anime.findUnique({
            where: {
                id: String(data.toInsert.id),
            },
        })
        : await database_1.prisma.manga.findUnique({
            where: {
                id: String(data.toInsert.id),
            },
        });
    if (existing) {
        await event_1.default.emitAsync(event_1.Events.COMPLETED_ENTRY_CREATION, data.toInsert);
        return existing;
    }
    if (data.type === "ANIME" /* Type.ANIME */) {
        if (Array.isArray(data.toInsert.season)) {
            console.log(colors_1.default.yellow("Fixed season for anime."));
            data.toInsert.season = data.toInsert.season[0];
        }
    }
    data.type === "ANIME" /* Type.ANIME */
        ? await database_1.prisma.anime.create({
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
                currentEpisode: data.toInsert.currentEpisode,
                description: data.toInsert.description,
                duration: data.toInsert.duration,
                format: data.toInsert.format,
                genres: data.toInsert.genres,
                mappings: data.toInsert.mappings,
                relations: data.toInsert.relations,
                season: data.toInsert.season,
                status: data.toInsert.status,
                synonyms: data.toInsert.synonyms,
                tags: data.toInsert.tags,
                totalEpisodes: data.toInsert.totalEpisodes,
                trailer: data.toInsert.trailer,
                year: data.toInsert.year,
            },
        })
        : await database_1.prisma.manga.create({
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
                totalChapters: data.toInsert.totalChapters,
                totalVolumes: data.toInsert.totalVolumes,
                description: data.toInsert.description,
                format: data.toInsert.format,
                genres: data.toInsert.genres,
                mappings: data.toInsert.mappings,
                relations: data.toInsert.relations,
                status: data.toInsert.status,
                synonyms: data.toInsert.synonyms,
                tags: data.toInsert.tags,
            },
        });
    await event_1.default.emitAsync(event_1.Events.COMPLETED_ENTRY_CREATION, data.toInsert);
    return data.toInsert;
};
exports.createEntry = createEntry;
