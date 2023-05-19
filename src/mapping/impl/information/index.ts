import { Anime, Format, Manga, Type } from "../..";

export default abstract class InformationProvider<T extends Anime | Manga, U extends AnimeInfo | MangaInfo> {
    abstract id: string;
    abstract url: string;

    async search(query: string, type: Type, formats: Format[]): Promise<U[] | undefined> {
        return [];
    }

    async info(media: T): Promise<U | undefined> {
        return undefined;
    }

    get priorityArea(): MediaInfoKeys[] {
        return [];
    }

    get sharedArea(): MediaInfoKeys[] {
        return [];
    }
}

export type AnimeInfo = Pick<Anime, "title" | "synonyms" | "totalEpisodes" | "currentEpisode" | "bannerImage" | "coverImage" | "color" | "season" | "year" | "status" | "genres" | "description" | "format" | "duration" | "trailer" | "countryOfOrigin" | "tags"> & {
    rating: number | null;
    popularity: number | null;
};

export type MangaInfo = Pick<Manga, "title" | "synonyms" | "totalChapters" | "bannerImage" | "coverImage" | "color" | "status" | "genres" | "description" | "format" | "totalVolumes" | "countryOfOrigin" | "tags"> & {
    rating: number | null;
    popularity: number | null;
};

type SharedKeys<T, U> = {
    [K in keyof T]: K extends keyof U ? K : never;
}[keyof T];

export type MediaInfoKeys = SharedKeys<AnimeInfo, MangaInfo>;
