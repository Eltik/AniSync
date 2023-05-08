import axios from "axios";
import MangaProvider from ".";
import { Format, Result } from "../..";
import { stringSearch } from "@/src/helper";

export default class MangaSee extends MangaProvider {
    override rateLimit = 250;
    override id = "mangasee";
    override url = "https://mangasee123.com";

    override formats: Format[] = [Format.MANGA, Format.ONE_SHOT];

    override async search(query: string): Promise<Result[] | undefined> {
        const list = await this.getMangaList();
        const results:Result[] = [];

        for (let i = 0; i < list.length; i++) {
            if (stringSearch(list[i].s, query) >= 1) {
                results.push({
                    title: list[i].s,
                    id: `/manga/${list[i].i}`,
                    altTitles: list[i].a,
                    year: 0,
                    img: null,
                    format: Format.UNKNOWN,
                    providerId: this.id,
                })
            }
        }
        return results;
    }

    private async getMangaList(): Promise<SearchResult[]> {
        const req = await axios(`${this.url}/_search.php`, { method: "POST", headers: {
            Referer: this.url
        }});
        const data:[SearchResult] = req.data;
        return data;
    }
}

interface SearchResult {
    i: string; // image
    s: string; // Main title
    a: [string]; // Alternative titles
}