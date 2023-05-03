import InformationProvider, { AnimeInfo, MangaInfo } from ".";
import { Anime, Format, Genres, Manga, MediaStatus, Season, Type } from "../..";

export default class MAL extends InformationProvider {
    override id: string = "mal";
    override url: string = "https://myanimelist.net";

    private statusMap = {
        "not yet aired": MediaStatus.NOT_YET_RELEASED,
        "currently airing": MediaStatus.RELEASING,
        "finished airing": MediaStatus.FINISHED
    }

    override get priorityArea(): (keyof AnimeInfo | MangaInfo)[] {
        return [];
    }

    override get sharedArea(): (keyof AnimeInfo | MangaInfo)[] {
        return ["synonyms", "genres"];
    }

    override async info(media: Anime | Manga): Promise<AnimeInfo | MangaInfo | undefined> {
        const malId = media.malId;

        const jikanResponse = (await (await fetch(`https://api.jikan.moe/v4/${media.type.toLowerCase()}/${malId}/full`)).json());

        const data: JikanResponse = jikanResponse.data;

        if (!data) return undefined;

        return {
            title: {
                english: data.title_english ?? null,
                romaji: data.title ?? null,
                native: data.title_japanese ?? null
            },
            currentEpisode: data.status === "completed" ? data.episodes : null,
            trailer: data.trailer ? data.trailer.url : null,
            coverImage: data.images?.jpg?.image_url ?? null,
            bannerImage: null,
            color: null,
            totalEpisodes: data.episodes ?? 0,
            status: data.status ? this.statusMap[(data.status as string).toLowerCase()] : null,
            popularity: data.popularity,
            synonyms: data.title_synonyms?.filter(s => s?.length) ?? [],
            season: data.season ? [(data.season as string).toUpperCase()] as unknown as Season : Season.UNKNOWN,
            genres: data.genres ? data.genres.map(g => g.name) as Genres[] : [],
            description: data.synopsis ?? null,
            rating: data.score ?? null,
            year: data.year ?? null,
            duration: data.duration ? Number.parseInt(data.duration.replace("min per ep", "").trim()) : null,
            format: data.type.toUpperCase() as Format,
            countryOfOrigin: null,
            tags: []
        }
    }
}

type JikanResponse = {
    title: string,
    title_english: string | null,
    title_japanese: string | null,
    title_synonyms: string[],
    type: string,
    status: string,
    synopsis: string | null,
    images: {
        jpg: {
            image_url: string | null
        }
    },
    duration: string,
    episodes: number | null,
    popularity: number | null,
    score: number | null,
    season: string,
    year: number | null,
    genres: { name: string }[],
    trailer: { url: string | null }
}