import { load } from "cheerio";
import { ProviderType } from "../types/API";
import Provider from "../types/Provider";
import { Result } from "../Core";
import { Format } from "../meta/AniList";

/**
 * @description I coded this so that it only takes in raw manga.
 */

export default class MangaReader extends Provider {
    constructor() {
        super("https://mangareader.one", ProviderType.MANGA, [Format.MANGA, Format.ONE_SHOT], "MangaReader");
        this.rateLimit = 250;
    }

    public async search(query: string): Promise<Result[]> {
        const req = await this.fetch(`${this.baseURL}/search.html?keyword=${encodeURIComponent(query)}`);
        try {
            req.text();
        } catch (e) {
            return [];
        }
        const $ = load(req.text());

        const results:Result[] = [];

        $("div.container div.row div.media-block").map((i, el) => {
            const url = this.baseURL + $(el).find("a").attr("href");
            const title = $(el).find("div.info h3").text();
            const img = $(el).find("a").attr("data-src");
            const lang = $(el).find("a.rating").text();
            
            // Now it'll only respond with Japanese/raw manga
            if (lang.toLowerCase().includes("ja")) {
                results.push({
                    title,
                    url,
                    img
                })
            }
        })
        return results;
    }
}