import { load } from "cheerio";
import Provider from "../Provider";
import { ProviderType } from "../API";
import { Result } from "../Sync";

export default class MangaPark extends Provider {
    constructor() {
        super("https://v2.mangapark.net", ProviderType.MANGA);
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