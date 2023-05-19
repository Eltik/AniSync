import { AxiosRequestConfig, AxiosResponse } from "axios";
import { Anime, Format, Manga, Type } from "../..";
import InformationProvider, { AnimeInfo, MangaInfo, MediaInfoKeys } from ".";
export default class AniList extends InformationProvider<Anime | Manga, AnimeInfo | MangaInfo> {
    id: string;
    url: string;
    private api;
    get priorityArea(): MediaInfoKeys[];
    get sharedArea(): MediaInfoKeys[];
    search(query: string, type: Type, formats: Format[], page?: number, perPage?: number): Promise<AnimeInfo[] | MangaInfo[] | undefined>;
    info(media: Anime | Manga): Promise<AnimeInfo | MangaInfo | undefined>;
    getMedia(id: string): Promise<AnimeInfo | MangaInfo | undefined>;
    fetchSeasonal(type: Type, formats: Format[]): Promise<{
        trending: any;
        seasonal: any;
        popular: any;
        top: any;
    } | undefined>;
    private fetchManamiProject;
    batchRequest(queries: string[], maxQueries: number): Promise<any | undefined>;
    private executeGraphQLQuery;
    /**
     * @description Custom request function for handling AniList rate limit.
     */
    request(url: string, options?: AxiosRequestConfig, retries?: number): Promise<AxiosResponse | null>;
    query: string;
}
