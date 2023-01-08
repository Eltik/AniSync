import Anime, { SearchResponse } from "./Anime";
import { load } from "cheerio";

export default class ZoroTo extends Anime {
    // For whether sub/dub
    private subOrDub:string = "sub";
    private ajax:string = `${this.baseUrl}/ajax/v2`;

    constructor() {
        super("https://zoro.to", "ZoroTo");
    }

    public async search(query:string): Promise<Array<SearchResponse>> {
        const dom = await this.fetchDOM(`${this.baseUrl}/search?keyword=${encodeURIComponent(query)}`, ".film_list-wrap > div.flw-item");
        const results = [];

        const $ = load(dom.Response.text());
        
        dom.Cheerio.map((index, element) => {
            const title = $(element).find('div.film-detail h3.film-name a.dynamic-name').attr('title').trim().replace(/\\n/g, '');
            const jName = $(element).find('div.film-detail h3.film-name a.dynamic-name').attr("data-jname").trim().replace(/\\n/g, '');
            const id = $(element).find('div:nth-child(1) > a').last().attr('href');
            const url = this.baseUrl + id;

            results.push({
                url,
                id,
                title,
                romaji: jName
            })
        })

        return results;
    }
}