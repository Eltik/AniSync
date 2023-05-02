import { PrismaClient } from '@prisma/client';
import { Prisma as Pris } from "@prisma/client";
import { Anime, Format, Manga, Type } from '../mapping';
export * from '@prisma/client';

const averageMetric = (object: PrismaJson.MetaSitesMetric) => {
    let average = 0, validCount = 0;
    for (let [_, v] of Object.entries(object)) {
        if (v && typeof v === "number") {
            average += v;
            validCount++;
        }
    }

    return validCount === 0 ? 0 : Number.parseFloat((average / validCount).toFixed(2))
}

let $prisma = new PrismaClient({
    log: ["error"]
});

const dedupeFields = ["synonyms", "genres"];

$prisma.$use(async (params, next) => {
    if (params.model === "Manga" || params.model === "Anime") {
        if (!params?.args) return next(params);

        for (let field of dedupeFields) {
            if (params.args['data'] && params.args['data'][field]) {
                params.args['data'][field] = Array.from(new Set(params.args['data'][field]))
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

                if (result?.synonyms) result.synonyms = Array.from(new Set(result.synonyms));
                if (result?.genres) result.genres = Array.from(new Set(result.genres));

                return result;
            }
        },
        manga: {
            async $allOperations({ model, operation, args, query }) {
                const result = await query(args);

                if (result?.synonyms) result.synonyms = Array.from(new Set(result.synonyms));
                if (result?.genres) result.genres = Array.from(new Set(result.genres));

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
        }
    }
});

const globalForPrisma = global as unknown as { prisma: typeof modifiedPrisma }

export const prisma = globalForPrisma.prisma || modifiedPrisma;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = modifiedPrisma;

declare global {
    namespace PrismaJson {
        type AnimeTitle = {
            english: string | null;
            romaji: string | null;
            native: string | null;
        }

        type AnimeRating = MetaSitesMetric;
        type AnimePopularity = MetaSitesMetric;

        type MetaSitesMetric = {
            anilist: number | SplitEntryMapping | null;
            mal: number | SplitEntryMapping | null;
            kitsu: number | SplitEntryMapping | null;
        }

        type SubdubMapping = {
            sub: string | number | null;
            dub: string | number | null;
        }

        type SplitEntryMapping = `${number}@${number}-${number}`;
    }
}

export const seasonal = async (trending: Anime[] | Manga[], popular: Anime[] | Manga[], top: Anime[] | Manga[], seasonal: Anime[] | Manga[]) => {
    const trend = trending.map(a => String(a.aniListId));
    const pop = popular.map(a => String(a.aniListId));
    const t = top.map(a => String(a.aniListId));
    const season = seasonal.map(a => String(a.aniListId));

    if (trending[0] && trending[0].type === Type.ANIME) {
        const trending = await prisma.anime.findMany({
            where: {
                id: {
                    in: [...trend]
                }
            }
        });

        const popular = await prisma.anime.findMany({
            where: {
                id: {
                    in: [...pop]
                }
            }
        });

        const top = await prisma.anime.findMany({
            where: {
                id: {
                    in: [...t]
                }
            }
        });

        const seasonal = await prisma.anime.findMany({
            where: {
                id: {
                    in: [...season]
                }
            }
        });

        return { trending, popular, top, seasonal };
    } else {
        const trending = await prisma.manga.findMany({
            where: {
                id: {
                    in: [...trend]
                }
            }
        });

        const popular = await prisma.manga.findMany({
            where: {
                id: {
                    in: [...pop]
                }
            }
        });

        const top = await prisma.manga.findMany({
            where: {
                id: {
                    in: [...t]
                }
            }
        });

        const seasonal = await prisma.manga.findMany({
            where: {
                id: {
                    in: [...season]
                }
            }
        });

        return { trending, popular, top, seasonal };
    }
}

export const search = async (query: string, type: Type, formats: Format[], page: number, perPage: number) => {
    const skip = page > 0 ? perPage * (page - 1) : 0;
    let where;
    
    if (type === Type.ANIME) {
        where = Pris.sql`
            WHERE
            (
                ${"%" + query + "%"}        ILIKE ANY("anime".synonyms)
                OR  ${"%" + query + "%"}    % ANY("anime".synonyms)
                OR  "anime".title->>'english' ILIKE ${"%" + query + "%"}
                OR  "anime".title->>'romaji'  ILIKE ${"%" + query + "%"}
                OR  "anime".title->>'native'  ILIKE ${"%" + query + "%"}
            )
            ${formats.length > 0 ? Pris.sql`AND "anime"."format" IN (${Pris.join(
                formats.map(f => Pris.raw(`'${f}'`)),
                ", "
            )})` : Pris.empty}
        `;
    } else {
        where = Pris.sql`
            WHERE
            (
                ${"%" + query + "%"}        ILIKE ANY("manga".synonyms)
                OR  ${"%" + query + "%"}    % ANY("manga".synonyms)
                OR  "manga".title->>'english' ILIKE ${"%" + query + "%"}
                OR  "manga".title->>'romaji'  ILIKE ${"%" + query + "%"}
                OR  "manga".title->>'native'  ILIKE ${"%" + query + "%"}
            )
            ${formats.length > 0 ? Pris.sql`AND "manga"."format" IN (${Pris.join(
                formats.map(f => Pris.raw(`'${f}'`)),
                ", "
            )})` : Pris.empty}
        `;
    }

    let [count, results] = [0, []];
    if (type === Type.ANIME) {
        [count, results] = await prisma.$transaction([
            prisma.$queryRaw`
                    SELECT COUNT(*) FROM "anime"
                    ${where}
                `,
            prisma.$queryRaw`
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
    } else {
        [count, results] = await prisma.$transaction([
            prisma.$queryRaw`
                    SELECT COUNT(*) FROM "manga"
                    ${where}
                `,
            prisma.$queryRaw`
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

    const total: number = Number((count)[0].count);
    const lastPage = Math.ceil(Number(total) / perPage);

    return results;
}

export const info = async (id: string): Promise<Anime | Manga | null> => {
    let media: any = await prisma.anime.findUnique({
        where: { id }
    });

    if (!media) {
        media = await prisma.manga.findUnique({
            where: { id }
        });
    };

    if (!media) return null;

    if (media.synonyms) media.synonyms = Array.from(new Set(media.synonyms));
    if (media.genres) media.genres = Array.from(new Set(media.genres));

    return media;
}