import { load } from "cheerio";
import Provider from "../types/Provider";
import { ProviderType } from "../types/API";
import { Result } from "../Core";
import { Format } from "../meta/AniList";

export default class Zoro extends Provider {
    private api:string = `${this.baseURL}/ajax/v2`;

    constructor() {
        super("https://zoro.to", ProviderType.ANIME, [Format.MOVIE, Format.ONA, Format.OVA, Format.SPECIAL, Format.TV, Format.TV_SHORT], "Zoro");
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