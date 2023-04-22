import { load } from "cheerio";
import { ProviderType } from "../types/API";
import Provider from "../types/Provider";
import { Result } from "../Core";
import { Format } from "./AniList";

export default class LiveChart extends Provider {
    // HAS A REALLY HIGH RATE LIMIT
    constructor() {
        super("https://www.livechart.me", ProviderType.ANIME, [Format.MOVIE, Format.ONA, Format.OVA, Format.SPECIAL, Format.TV, Format.TV_SHORT], "LiveChart");
        this.rateLimit = 1000;
    }

    public async search(query:string): Promise<Array<Result>> {
        const results:Result[] = [];
        
        const req = await this.fetch(`${this.baseURL}/search?q=${encodeURIComponent(query)}`);
        const $ = load(req.text());
        $('div.callout.grouped-list.anime-list > li.anime-item').each((i, e) => {
            results.push({
                title: $(e).attr('data-title'),
                url: `${this.baseURL}/anime/${$(e).attr('data-anime-id')}`,
            });
        });

        return results;
    }
}