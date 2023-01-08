import { join } from "path";
import API from "../../API";
import AniList, { Media } from "../../AniList";
import { Database } from "sqlite3";
import AniSync, { Mapping } from "../../AniSync";
import { config } from "../../config";

export default class Anime extends API {
    public baseUrl:string = undefined;
    private db = new Database(join(__dirname, "../db.db"));
    private aniSync = new AniSync();
    private config = config.mapping.anime;

    public AGGREGATORS = {
        ZoroTo: "https://zoro.to",
        Crunchyroll: "https://crunchyroll.com"
    }

    constructor(baseUrl:string) {
        super();
        this.baseUrl = baseUrl;
    }

    public async search(any?): Promise<SearchResponse[]> {
        throw new Error("Method not implemented.");
    }

    public compare(anime:SearchResponse, aniList:[Media]) {
        const result = [];
        for (let i = 0; i < aniList.length; i++) {
            const media:Media = aniList[i];

            const map1:Mapping = {
                title: anime.title,
                romaji: anime.romaji,
                native: anime.native
            };
            const map2:Mapping = {
                title: media.title.english,
                romaji: media.title.romaji,
                native: media.title.native
            }

            const comparison = this.aniSync.checkItem(map1, map2);
            if (comparison > this.config.comparison_threshold) {
                result.push({
                    anime,
                    media,
                    comparison
                })
            }
        }
        // It is possible that there are multiple results, so we need to sort them. But generally, there should only be one result.
        return result[0];
    }
}

interface SearchResponse {
    url: string;
    id: string;
    img: string;
    title: string;
    romaji?: string;
    native?: string;
}

export type { SearchResponse };