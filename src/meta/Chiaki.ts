import { ProviderType } from "../types/API";
import Provider from "../types/Provider";
import { Result } from "../Core";
import { Format } from "./AniList";

export default class Chiaki extends Provider {

    constructor() {
        super("https://chiaki.site", ProviderType.ANIME, [Format.MOVIE, Format.ONA, Format.OVA, Format.SPECIAL, Format.TV, Format.TV_SHORT], "Chiaki");
        this.rateLimit = 500;
    }

    public async search(query:string): Promise<Array<Result>> {
        // https://chiaki.site/?/tools/autocomplete_series&term=Kaguya-sama
        const req = await this.fetch(`${this.baseURL}/?/tools/autocomplete_series&term=${encodeURIComponent(query)}`);
        const data:[SearchResult] = req.json();

        const results:Array<Result> = [];
        data.map((element, index) => {
            results.push({
                title: element.value,
                url: `${this.baseURL}/?/tools/watch_order/id/${element.id}`,
            })
        })
        return results;
    }
}

interface SearchResult {
    id: string;
    image: string;
    type: string;
    value: string;
    year: number;
}