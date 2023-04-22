import { load } from "cheerio";
import Provider from "../types/Provider";
import { ProviderType } from "../types/API";
import { Result } from "../Core";
import { Format } from "../meta/AniList";

export default class MangaPark extends Provider {
    constructor() {
        super("https://v2.mangapark.net", ProviderType.MANGA, [Format.MANGA, Format.ONE_SHOT], "MangaPark");
        this.rateLimit = 250;
    }

    public async search(query: string): Promise<Result[]> {
        const url = `${this.baseURL}/search?q=${encodeURIComponent(query)}`;
        try {
            const data = await this.fetch(url);
            const $ = load(data.text());
        
            const results:any = $('.item').get().map(item => {
                const cover = $(item).find('.cover');
                return {
                    id: `${cover.attr('href')}`,
                    url: `${this.baseURL}${cover.attr("href")}`,
                    title: `${cover.attr('title')}`,
                    img: `${$(cover).find('img').attr('src')}}`,
                };
            });
        
            return results;
        } catch (err) {
            throw new Error((err as Error).message);
        }
    }
}