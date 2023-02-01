import { load } from "cheerio";
import Provider from "../Provider";
import { ProviderType } from "../API";
import { Result } from "../Sync";

export default class Zoro extends Provider {
    constructor() {
        super("https://zoro.to", ProviderType.ANIME);
    }

    public async search(query:string): Promise<Array<Result>> {
        const dom = await this.fetch(`${this.baseURL}/search?keyword=${encodeURIComponent(query)}`);
        const results = [];

        const $ = load(dom.text());
        
        $(".film_list-wrap > div.flw-item").map((index, element) => {
            const title = $(element).find('div.film-detail h3.film-name a.dynamic-name').attr('title').trim().replace(/\\n/g, '');
            const id = $(element).find('div:nth-child(1) > a').last().attr('href');
            const url = this.baseURL + id;

            results.push({
                url,
                title
            })
        })

        return results;
    }
}