import Manga, { SearchResponse } from "./Manga";

export default class MangaSee extends Manga {
    constructor() {
        super("https://mangasee123.com", "MangaSee");
    }

    public async search(query: string): Promise<SearchResponse[]> {
        const list = await this.getMangaList();
        const results:SearchResponse[] = [];

        for (let i = 0; i < list.length; i++) {
            if (this.stringSearch(list[i].s, query) >= 1) {
                results.push({
                    id: "/manga/" + list[i].i,
                    title: list[i].s,
                    url: `${this.baseUrl}/manga/${list[i].i}`,
                    img: `https://temp.compsci88.com/cover/${list[i].i}.jpg`,
                })
            }
        }
        return results;
    }

    private async getMangaList(): Promise<Array<SearchResult>> {
        const data = await this.fetch(`${this.baseUrl}/_search.php`, { method: "POST", headers: {
            Referer: this.baseUrl
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