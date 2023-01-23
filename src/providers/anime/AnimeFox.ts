import Anime, { SearchResponse } from "./Anime";
import { load } from "cheerio";

export default class AnimeFox extends Anime {
    constructor() {
        super("https://animefox.tv", "AnimeFox");
    }

    public async search(query:string): Promise<Array<SearchResponse>> {
        const dom = await this.fetchDOM(`${this.baseUrl}/search?keyword=${encodeURIComponent(query)}`, "div.film_list-wrap > div");
        const results = [];

        const $ = load(dom.Response.text());
        
        dom.Cheerio.map((index, element) => {
            const id = $(element).find("div.film-poster > a").attr('href')!;
            // Title is generally just the romaji name, or the same as the jname
            //const title = $(element).find("a.dynamic-name").attr('title')!;
            const jName = $(element).find("a.dynamic-name").attr("data-jname")!;
            const format = $(element).find("div.fd-infor > span:nth-child(1)").text()!.split(" ")[0];
            const url = this.baseUrl + id;

            results.push({
                url,
                id,
                format,
                romaji: jName
            })
        })

        return results;
    }
}