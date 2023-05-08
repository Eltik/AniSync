import { MediaFormat, prisma } from 'database';
import emitter, { Events } from '@/src/helper/event';
import { Anime, Manga, Season, Type } from '../mapping';
import colors from 'colors';

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

    if (data.type === Type.ANIME) {
        if (Array.isArray((data.toInsert as any).season)) {
            console.log(colors.yellow("Fixed season for anime."));
            (data.toInsert as any).season = (data.toInsert as any).season[0];
        }
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
            currentEpisode: (data.toInsert as any).currentEpisode,
            description: data.toInsert.description,
            duration: (data.toInsert as any).duration,
            format: data.toInsert.format as MediaFormat,
            genres: data.toInsert.genres,
            mappings: data.toInsert.mappings,
            relations: data.toInsert.relations,
            season: (data.toInsert as any).season as Season,
            status: data.toInsert.status,
            synonyms: data.toInsert.synonyms,
            tags: data.toInsert.tags,
            totalEpisodes: (data.toInsert as any).totalEpisodes,
            trailer: (data.toInsert as any).trailer,
            year: (data.toInsert as any).year,
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
            totalChapters: (data.toInsert as any).totalChapters,
            totalVolumes: (data.toInsert as any).totalVolumes,
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
