import { load } from "cheerio";
import Manga, { SearchResponse } from "./Manga";
import { config } from "../../config";

export default class MangaPark extends Manga {
    constructor() {
        super("https://v2.mangapark.net", "MangaPark");
    }

    public async search(query: string): Promise<SearchResponse[]> {
        const url = `${this.baseUrl}/search?q=${query}`;
        try {
            const data = await this.fetch(url);
            const $ = load(data.text());
        
            const results:any = $('.item').get().map(item => {
                const cover = $(item).find('.cover');
                return {
                    id: `${cover.attr('href')}`,
                    url: `${this.baseUrl}${cover.attr("href")}`,
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