import Provider from "../Provider";
import { ProviderType } from "../API";
import { Result } from "../Sync";

export default class AnimePahe extends Provider {
    constructor() {
        super("https://animepahe.com", ProviderType.ANIME);
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