import axios from "axios";
import MangaProvider from ".";
import { Format, Result } from "../..";
import { load } from "cheerio";

export default class NovelBuddy extends MangaProvider {
    override id: string = "novelbuddy";
    override url: string = "https://novelbuddy.com";
    
    override formats: Format[] = [Format.NOVEL];

    override async search(query: string): Promise<Result[] | undefined> {
        const results: Result[] = [];

        const { data } = await axios(`${this.url}/search?q=${encodeURIComponent(query)}`);

        const $ = load(data);

        $("div.container div.manga-list div.book-item").map((i, el) => {
            const url = `${$(el).find("a").attr("href")}`;
            const title = $(el).find("a").attr("title");
            const img = `https:${$(el).find("img").attr("data-src")}`;

            results.push({
                id: url,
                title: title?.trim()!,
                img: img,
                year: 0,
                altTitles: [],
                providerId: this.id
            })
        })

        return results;
    }
}