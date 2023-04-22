import { ProviderType } from "../types/API";
import Provider from "../types/Provider";
import { Result } from "../Core";
import { Format } from "../meta/AniList";

export default class MangaSee extends Provider {
    constructor() {
        super("https://mangasee123.com", ProviderType.MANGA, [Format.MANGA, Format.ONE_SHOT], "MangaSee");
        this.rateLimit = 250;
    }

    public async search(query: string): Promise<Result[]> {
        const list = await this.getMangaList();
        const results:Result[] = [];

        for (let i = 0; i < list.length; i++) {
            if (this.stringSearch(list[i].s, query) >= 1) {
                results.push({
                    title: list[i].s,
                    url: `${this.baseURL}/manga/${list[i].i}`,
                })
            }
        }
        return results;
    }

    private async getMangaList(): Promise<Array<SearchResult>> {
        const data = await this.fetch(`${this.baseURL}/_search.php`, { method: "POST", headers: {
            Referer: this.baseURL
        }});
        const res:[SearchResult] = data.json();
        return res;
    }
}

interface SearchResult {
    i: string; // image
    s: string; // Main title
    a: [string]; // Alternative titles
}