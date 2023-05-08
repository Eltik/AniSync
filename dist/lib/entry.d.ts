import { MediaFormat } from 'database';
import { Anime, Manga, Type } from '../mapping';
export declare const createEntry: (data: {
    toInsert: Anime | Manga;
    type: Type;
}) => Promise<Anime | Manga | {
    title: PrismaJson.AnimeTitle;
    synonyms: string[];
    totalEpisodes: number | null;
    currentEpisode: number | null;
    bannerImage: string | null;
    coverImage: string | null;
    color: string | null;
    season: import("database").AiringSeason;
    year: number | null;
    status: import("database").AiringStatus | null;
    genres: string[];
    description: string | null;
    format: MediaFormat | null;
    duration: number | null;
    trailer: string | null;
    countryOfOrigin: string | null;
    tags: string[];
    rating: PrismaJson.MetaSitesMetric;
    popularity: PrismaJson.MetaSitesMetric;
    id: string;
    malId: string;
    slug: string;
    kitsuId: string | null;
    mappings: import("database").Prisma.JsonValue;
    type: string;
    relations: import("database").Prisma.JsonValue;
    averageRating: number;
    averagePopularity: number;
    save: () => import("database").Prisma.Prisma__AnimeClient<{
        title: PrismaJson.AnimeTitle;
        synonyms: string[];
        totalEpisodes: number | null;
        currentEpisode: number | null;
        bannerImage: string | null;
        coverImage: string | null;
        color: string | null;
        season: import("database").AiringSeason;
        year: number | null;
        status: import("database").AiringStatus | null;
        genres: string[];
        description: string | null;
        format: MediaFormat | null;
        duration: number | null;
        trailer: string | null;
        countryOfOrigin: string | null;
        tags: string[];
        rating: PrismaJson.MetaSitesMetric;
        popularity: PrismaJson.MetaSitesMetric;
        id: string;
        malId: string;
        slug: string;
        kitsuId: string | null;
        mappings: import("database").Prisma.JsonValue;
        type: string;
        relations: import("database").Prisma.JsonValue;
        averageRating: number | null;
        averagePopularity: number | null;
    }, never, {
        result: {};
        model: {};
        query: {};
        client: {};
    }>;
} | {
    title: PrismaJson.AnimeTitle;
    synonyms: string[];
    bannerImage: string | null;
    coverImage: string | null;
    color: string | null;
    status: import("database").AiringStatus | null;
    genres: string[];
    description: string | null;
    format: MediaFormat | null;
    duration: number | null;
    countryOfOrigin: string | null;
    tags: string[];
    rating: PrismaJson.MetaSitesMetric;
    popularity: PrismaJson.MetaSitesMetric;
    totalChapters: number | null;
    totalVolumes: number | null;
    id: string;
    malId: string;
    slug: string;
    kitsuId: string | null;
    mappings: import("database").Prisma.JsonValue;
    type: string;
    relations: import("database").Prisma.JsonValue;
    averageRating: number;
    averagePopularity: number;
    save: () => import("database").Prisma.Prisma__MangaClient<{
        title: PrismaJson.AnimeTitle;
        synonyms: string[];
        bannerImage: string | null;
        coverImage: string | null;
        color: string | null;
        status: import("database").AiringStatus | null;
        genres: string[];
        description: string | null;
        format: MediaFormat | null;
        duration: number | null;
        countryOfOrigin: string | null;
        tags: string[];
        rating: PrismaJson.MetaSitesMetric;
        popularity: PrismaJson.MetaSitesMetric;
        totalChapters: number | null;
        totalVolumes: number | null;
        id: string;
        malId: string;
        slug: string;
        kitsuId: string | null;
        mappings: import("database").Prisma.JsonValue;
        type: string;
        relations: import("database").Prisma.JsonValue;
        averageRating: number | null;
        averagePopularity: number | null;
    }, never, {
        result: {};
        model: {};
        query: {};
        client: {};
    }>;
}>;
