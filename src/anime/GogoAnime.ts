import { load } from "cheerio";
import Provider from "../Provider";
import { ProviderType } from "../API";
import { Result } from "../Sync";

export default class GogoAnime extends Provider {
    constructor() {
        super("https://www1.gogoanime.bid", ProviderType.ANIME);
    }

    public async search(query:string): Promise<Array<Result>> {
        const dom = await this.fetch(`${this.baseURL}/search.html?keyword=${encodeURIComponent(query)}`);
        const results = [];

        const $ = load(dom.text());

        $("div.last_episodes > ul > li").map((index, element) => {
            const title = $(element).find('p.name > a').attr('title')!;
            const id = "/category/" + $(element).find('p.name > a').attr('href')?.split('/')[2]!;
            const url = this.baseURL + id;

            results.push({
                url,
                title: title
            })
        })

        return results;
    }
}