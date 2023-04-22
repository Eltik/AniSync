import Provider from "../types/Provider";
import { ProviderType } from "../types/API";
import { Result } from "../Core";
import { Format } from "../meta/AniList";

export default class AnimePahe extends Provider {
    constructor() {
        super("https://animepahe.ru", ProviderType.ANIME, [Format.MOVIE, Format.ONA, Format.OVA, Format.SPECIAL, Format.TV, Format.TV_SHORT], "AnimePahe");
        this.altURLs = [
            "https://animepahe.com",
            "https://animepahe.org",
        ]
    }

    public async search(query:string): Promise<Array<Result>> {
        const req = await this.fetch(`${this.baseURL}/api?m=search&q=${encodeURIComponent(query)}`);
        const data = req.json();

        if (!data.data) {
            return [];
        }
        return data.data.map((item:SearchResponse) => ({
            title: item.title,
            url: `${this.baseURL}/anime/${item.session}`
        }));
    }
}

interface SearchResponse {
    id: number;
    title: string;
    type: string;
    episodes: number;
    status: string;
    season: string;
    year: number;
    score: number;
    poster: string;
    session: string;
}