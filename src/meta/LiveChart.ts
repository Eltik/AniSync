import { load } from "cheerio";
import { ProviderType } from "../API";
import Provider from "../Provider";
import { Result } from "../Sync";

export default class LiveChart extends Provider {
    constructor() {
        super("https://www.livechart.me", ProviderType.ANIME);
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