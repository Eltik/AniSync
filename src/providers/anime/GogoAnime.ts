import Anime, { SearchResponse } from "./Anime";
import { load } from "cheerio";

export default class GogoAnime extends Anime {
    constructor() {
        super("https://www1.gogoanime.bid", "GogoAnime");
    }

    public async search(query:string): Promise<Array<SearchResponse>> {
        const dom = await this.fetchDOM(`${this.baseUrl}/search.html?keyword=${encodeURIComponent(query)}`, "div.last_episodes > ul > li");
        const results = [];

        const $ = load(dom.Response.text());
        
        dom.Cheerio.map((index, element) => {
            const title = $(element).find('p.name > a').attr('title')!;
            const img = $(element).find('div > a > img').attr('src');
            const id = "/category/" + $(element).find('p.name > a').attr('href')?.split('/')[2]!;
            const url = this.baseUrl + id;

            results.push({
                url,
                id,
                img,
                romaji: title,
            })
        })

        return results;
    }
}