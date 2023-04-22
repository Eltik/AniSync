import Provider from "../types/Provider";
import { Result } from "../Core";
import { load } from "cheerio";
import { ProviderType } from "../types/API";
import { Format } from "../meta/AniList";
import { compareTwoStrings } from "../libraries/StringSimilarity";

export default class JNovels extends Provider {
    constructor() {
        super("https://jnovels.com", ProviderType.MANGA, [Format.NOVEL], "JNovels");
        this.rateLimit = 500;
    }

    public async search(query:string): Promise<Array<Result>> {
        const list:Result[] = [];
        const results:Result[] = [];

        const req = await this.fetch(`${this.baseURL}/11light-1novel20-pdf/`);
        const $ = load(req.text());

        $("div.post-content ol li").map((i, el) => {
            const url = $(el).find("a").attr("href");
            const title = $(el).find("a").text();
            list.push({
                url: url,
                title: title?.trim()
            })
        })

        for (const result of list) {
            if (compareTwoStrings(query, result.title) > 0.3) {
                results.push(result);
            }
        }  

        return results;
    }
}