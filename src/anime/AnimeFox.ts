import { load } from "cheerio";
import { ProviderType } from "../types/API";
import Provider from "../types/Provider";
import { Result } from "../Core";
import { Format } from "../meta/AniList";

export default class AnimeFox extends Provider {
    constructor() {
        super("https://animefox.tv", ProviderType.ANIME, [Format.MOVIE, Format.ONA, Format.OVA, Format.SPECIAL, Format.TV, Format.TV_SHORT], "AnimeFox");
    }

    public async search(query:string): Promise<Array<Result>> {
        const dom = await this.fetch(`${this.baseURL}/search?keyword=${encodeURIComponent(query)}`);
        const results:Result[] = [];

        const $ = load(dom.text());
        
        $("div.film_list-wrap > div").map((index, element) => {
            const id = $(element).find("div.film-poster > a").attr('href')!;
            // Title is generally just the romaji name, or the same as the jname
            const title = $(element).find("a.dynamic-name").attr('title')!;
            //const jName = $(element).find("a.dynamic-name").attr("data-jname")!;
            const url = this.baseURL + id;

            results.push({
                url,
                title: title
            })
        })
        return results;
    }
}