import Provider from "../Provider";
import { ProviderType } from "../API";
import { Result } from "../Sync";

export default class Enime extends Provider {
    private api = 'https://api.enime.moe';

    constructor() {
        super("https://enime.moe", ProviderType.ANIME);
    }

    public async search(query:string): Promise<Array<Result>> {
        const page = 0;
        const perPage = 18;

        const req = await this.fetch(`${this.api}/search/${encodeURIComponent(query)}?page=${page}&perPage=${perPage}`);
        const data = req.json();

        if (!data.data) {
            return [];
        }
        return data.data.map((item:any) => ({
            url: `${this.api}/anime/${item.id}`,
            title: item.title.english ?? item.title.romaji ?? item.title.native,
        }));
    }
}