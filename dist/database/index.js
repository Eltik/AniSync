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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.info = exports.search = exports.seasonal = exports.prisma = void 0;
const client_1 = require("@prisma/client");
const client_2 = require("@prisma/client");
__exportStar(require("@prisma/client"), exports);
const averageMetric = (object) => {
    let average = 0, validCount = 0;
    for (const [_, v] of Object.entries(object)) {
        if (v && typeof v === "number") {
            average += v;
            validCount++;
        }
    }
    return validCount === 0 ? 0 : Number.parseFloat((average / validCount).toFixed(2));
};
const $prisma = new client_1.PrismaClient({
    log: ["error"]
});
const dedupeFields = ["synonyms", "genres"];
$prisma.$use(async (params, next) => {
    if (params.model === "Manga" || params.model === "Anime") {
        if (!params?.args)
            return next(params);
        for (const field of dedupeFields) {
            if (params.args['data'] && params.args['data'][field]) {
                params.args['data'][field] = Array.from(new Set(params.args['data'][field]));
            }
        }
    }
    return next(params);
});
const modifiedPrisma = $prisma.$extends({
    query: {
        anime: {
            async $allOperations({ model, operation, args, query }) {
                const result = await query(args);
                if (result?.synonyms)
                    result.synonyms = Array.from(new Set(result.synonyms));
                if (result?.genres)
                    result.genres = Array.from(new Set(result.genres));
                return result;
            }
        },
        manga: {
            async $allOperations({ model, operation, args, query }) {
                const result = await query(args);
                if (result?.synonyms)
                    result.synonyms = Array.from(new Set(result.synonyms));
                if (result?.genres)
                    result.genres = Array.from(new Set(result.genres));
                return result;
            }
        }
    },
    result: {
        anime: {
            save: {
                needs: { id: true },
                compute(anime) {
                    delete anime["averagePopularity"];
                    delete anime["averageRating"];
                    return () => $prisma.anime.update({ where: { id: anime.id }, data: anime });
                }
            },
            averageRating: {
                needs: { rating: true },
                compute(anime) {
                    return averageMetric(anime.rating);
                }
            },
            averagePopularity: {
                needs: { popularity: true },
                compute(anime) {
                    return averageMetric(anime.popularity);
                }
            }
        },
        manga: {
            save: {
                needs: { id: true },
                compute(manga) {
                    delete manga["averagePopularity"];
                    delete manga["averageRating"];
                    return () => $prisma.manga.update({ where: { id: manga.id }, data: manga });
                }
            },
            averageRating: {
                needs: { rating: true },
                compute(manga) {
                    return averageMetric(manga.rating);
                }
            },
            averagePopularity: {
                needs: { popularity: true },
                compute(manga) {
                    return averageMetric(manga.popularity);
                }
            }
        }
    }
});
const globalForPrisma = global;
exports.prisma = globalForPrisma.prisma || modifiedPrisma;
if (process.env.NODE_ENV !== "production")
    globalForPrisma.prisma = modifiedPrisma;
const seasonal = async (trending, popular, top, seasonal) => {
    const trend = trending.map(a => String(a.aniListId));
    const pop = popular.map(a => String(a.aniListId));
    const t = top.map(a => String(a.aniListId));
    const season = seasonal.map(a => String(a.aniListId));
    if (trending[0] && trending[0].type === "ANIME" /* Type.ANIME */) {
        const trending = await exports.prisma.anime.findMany({
            where: {
                id: {
                    in: [...trend]
                }
            }
        });
        const popular = await exports.prisma.anime.findMany({
            where: {
                id: {
                    in: [...pop]
                }
            }
        });
        const top = await exports.prisma.anime.findMany({
            where: {
                id: {
                    in: [...t]
                }
            }
        });
        const seasonal = await exports.prisma.anime.findMany({
            where: {
                id: {
                    in: [...season]
                }
            }
        });
        return { trending, popular, top, seasonal };
    }
    else {
        const trending = await exports.prisma.manga.findMany({
            where: {
                id: {
                    in: [...trend]
                }
            }
        });
        const popular = await exports.prisma.manga.findMany({
            where: {
                id: {
                    in: [...pop]
                }
            }
        });
        const top = await exports.prisma.manga.findMany({
            where: {
                id: {
                    in: [...t]
                }
            }
        });
        const seasonal = await exports.prisma.manga.findMany({
            where: {
                id: {
                    in: [...season]
                }
            }
        });
        return { trending, popular, top, seasonal };
    }
};
exports.seasonal = seasonal;
const search = async (query, type, formats, page, perPage) => {
    const skip = page > 0 ? perPage * (page - 1) : 0;
    let where;
    if (type === "ANIME" /* Type.ANIME */) {
        where = client_2.Prisma.sql `
            WHERE
            (
                ${"%" + query + "%"}        ILIKE ANY("anime".synonyms)
                OR  ${"%" + query + "%"}    % ANY("anime".synonyms)
                OR  "anime".title->>'english' ILIKE ${"%" + query + "%"}
                OR  "anime".title->>'romaji'  ILIKE ${"%" + query + "%"}
                OR  "anime".title->>'native'  ILIKE ${"%" + query + "%"}
            )
            ${formats.length > 0 ? client_2.Prisma.sql `AND "anime"."format" IN (${client_2.Prisma.join(formats.map(f => client_2.Prisma.raw(`'${f}'`)), ", ")})` : client_2.Prisma.empty}
        `;
    }
    else {
        where = client_2.Prisma.sql `
            WHERE
            (
                ${"%" + query + "%"}        ILIKE ANY("manga".synonyms)
                OR  ${"%" + query + "%"}    % ANY("manga".synonyms)
                OR  "manga".title->>'english' ILIKE ${"%" + query + "%"}
                OR  "manga".title->>'romaji'  ILIKE ${"%" + query + "%"}
                OR  "manga".title->>'native'  ILIKE ${"%" + query + "%"}
            )
            ${formats.length > 0 ? client_2.Prisma.sql `AND "manga"."format" IN (${client_2.Prisma.join(formats.map(f => client_2.Prisma.raw(`'${f}'`)), ", ")})` : client_2.Prisma.empty}
        `;
    }
    let [count, results] = [0, []];
    if (type === "ANIME" /* Type.ANIME */) {
        [count, results] = await exports.prisma.$transaction([
            exports.prisma.$queryRaw `
                    SELECT COUNT(*) FROM "anime"
                    ${where}
                `,
            exports.prisma.$queryRaw `
                    SELECT * FROM "anime"
                    ${where}
                    ORDER BY
                        (CASE WHEN "anime".title->>'english' IS NOT NULL THEN similarity(LOWER("anime".title->>'english'), LOWER(${query})) ELSE 0 END,
                        + CASE WHEN "anime".title->>'romaji' IS NOT NULL THEN similarity(LOWER("anime".title->>'romaji'), LOWER(${query})) ELSE 0 END,
                        + CASE WHEN "anime".title->>'native' IS NOT NULL THEN similarity(LOWER("anime".title->>'native'), LOWER(${query})) ELSE 0 END,
                        + CASE WHEN synonyms IS NOT NULL THEN most_similar(LOWER(${query}), synonyms) ELSE 0 END)
                            DESC
                    LIMIT    ${perPage}
                    OFFSET   ${skip}
                `,
        ]);
    }
    else {
        [count, results] = await exports.prisma.$transaction([
            exports.prisma.$queryRaw `
                    SELECT COUNT(*) FROM "manga"
                    ${where}
                `,
            exports.prisma.$queryRaw `
                    SELECT * FROM "manga"
                    ${where}
                     ORDER BY
                        (CASE WHEN "manga".title->>'english' IS NOT NULL THEN similarity(LOWER("manga".title->>'english'), LOWER(${query})) ELSE 0 END,
                        + CASE WHEN "manga".title->>'romaji' IS NOT NULL THEN similarity(LOWER("manga".title->>'romaji'), LOWER(${query})) ELSE 0 END,
                        + CASE WHEN "manga".title->>'native' IS NOT NULL THEN similarity(LOWER("manga".title->>'native'), LOWER(${query})) ELSE 0 END,
                        + CASE WHEN synonyms IS NOT NULL THEN most_similar(LOWER(${query}), synonyms) ELSE 0 END)
                            DESC
                    LIMIT    ${perPage}
                    OFFSET   ${skip}
                `,
        ]);
    }
    const total = Number((count)[0].count);
    const lastPage = Math.ceil(Number(total) / perPage);
    return results;
};
exports.search = search;
const info = async (id) => {
    let media = await exports.prisma.anime.findUnique({
        where: { id }
    });
    if (!media) {
        media = await exports.prisma.manga.findUnique({
            where: { id }
        });
    }
    if (!media)
        return null;
    if (media.synonyms)
        media.synonyms = Array.from(new Set(media.synonyms));
    if (media.genres)
        media.genres = Array.from(new Set(media.genres));
    return media;
};
exports.info = info;
