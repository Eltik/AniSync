import { load } from "cheerio";
import { ProviderType } from "../API";
import Provider from "../Provider";
import { Result } from "../Sync";

export default class AnimeFox extends Provider {
    constructor() {
        super("https://animefox.tv", ProviderType.ANIME);
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