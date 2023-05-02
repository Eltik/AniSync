import { Anime, Format, Manga, Type } from "../..";
export default abstract class InformationProvider {
    abstract id: string;
    abstract url: string;
    search(query: string, type: Type, formats: Format[]): Promise<AnimeInfo[] | MangaInfo[] | undefined>;
    info(media: Anime | Manga): Promise<AnimeInfo | MangaInfo | undefined>;
    get priorityArea(): (keyof AnimeInfo | MangaInfo)[];
    get sharedArea(): (keyof AnimeInfo | MangaInfo)[];
}
export type AnimeInfo = Pick<Anime, "title" | "synonyms" | "totalEpisodes" | "currentEpisode" | "bannerImage" | "coverImage" | "color" | "season" | "year" | "status" | "genres" | "description" | "format" | "duration" | "trailer" | "countryOfOrigin" | "tags"> & {
    rating: number | null;
    popularity: number | null;
};
export type MangaInfo = Pick<Manga, "title" | "synonyms" | "totalChapters" | "bannerImage" | "coverImage" | "color" | "status" | "genres" | "description" | "format" | "totalVolumes" | "countryOfOrigin" | "tags"> & {
    rating: number | null;
    popularity: number | null;
};
