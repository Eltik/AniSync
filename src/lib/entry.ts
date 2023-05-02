import { MediaFormat, prisma } from 'database';
import emitter, { Events } from '@/src/helper/event';
import { Anime, Manga, Season, Type } from '../mapping';

export const createEntry = async (data: { toInsert:Anime | Manga, type:Type }) => {
    const existing = data.type === Type.ANIME ? await prisma.anime.findUnique({ where: {
        id: String(data.toInsert.id)
    }}) : await prisma.manga.findUnique({ where: {
        id: String(data.toInsert.id)
    }});
    
    if (existing) {
        await emitter.emitAsync(Events.COMPLETED_ENTRY_CREATION, data.toInsert.id);
        return existing;
    }

    data.type === Type.ANIME ? await prisma.anime.create({
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
            format: data.toInsert.format as MediaFormat,
            genres: data.toInsert.genres,
            mappings: data.toInsert.mappings,
            relations: data.toInsert.relations,
            // @ts-ignore
            season: data.toInsert.season as Season,
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
    }) : await prisma.manga.create({
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
            format: data.toInsert.format as MediaFormat,
            genres: data.toInsert.genres,
            mappings: data.toInsert.mappings,
            relations: data.toInsert.relations,
            status: data.toInsert.status,
            synonyms: data.toInsert.synonyms,
            tags: data.toInsert.tags,
        }
    });

    await emitter.emitAsync(Events.COMPLETED_ENTRY_CREATION, data.toInsert.id);

    return data.toInsert;
}
