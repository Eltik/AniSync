import { ProviderType } from "../API";
import Provider from "../Provider";
import { Result } from "../Sync";

export default class MangaSee extends Provider {
    constructor() {
        super("https://mangasee123.com", ProviderType.MANGA);
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