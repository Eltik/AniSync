import { Anime, Format, Manga, Type } from "../..";

export default abstract class InformationProvider {
    abstract id: string;
    abstract url: string;

    async search(query:string, type:Type, formats: Format[]): Promise<AnimeInfo[] | MangaInfo[] | undefined> {
        return [];
    }

    async info(media: Anime | Manga): Promise<AnimeInfo | MangaInfo | undefined> {
        return undefined;
    }

    get priorityArea(): (keyof AnimeInfo | MangaInfo)[] {
        return [];
    }

    get sharedArea(): (keyof AnimeInfo | MangaInfo)[] {
        return [];
    }
}

export type AnimeInfo = Pick<Anime,
    "title" | "synonyms" | "totalEpisodes" | "currentEpisode" | "bannerImage" | "coverImage" | "color" | "season" | "year" | "status" | "genres" | "description" | "format" | "duration" | "trailer" | "countryOfOrigin" | "tags"
> & {
    rating: number | null,
    popularity: number | null
}

export type MangaInfo = Pick<Manga,
    "title" | "synonyms" | "totalChapters" | "bannerImage" | "coverImage" | "color" | "status" | "genres" | "description" | "format" | "totalVolumes" | "countryOfOrigin" | "tags"
> & {
    rating: number | null,
    popularity: number | null
}