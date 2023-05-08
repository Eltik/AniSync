import MangaProvider from ".";
import { Format, Result } from "../..";
import { load } from "cheerio";
import request from "cloudscraper-ts";

export default class NovelUpdates extends MangaProvider {
    override rateLimit = 1000;
    override id = "novelupdates";
    override url = "https://www.novelupdates.com";
    
    override formats: Format[] = [Format.NOVEL];

    override async search(query: string): Promise<Result[] | undefined> {
        const results: Result[] = [];

        const body:any = {
            action: "nd_ajaxsearchmain",
            strType: "desktop",
            strOne: query,
            strSearchType: "series"
        }

        const req = await request({
            uri: `${this.url}/wp-admin/admin-ajax.php`,
            method: "POST",
            formData: body
        })

        const $ = load(req);

        $("ul li").map((i, el) => {
            const url = `${$(el).find("a").attr("href")}`;
            const title = $(el).text();
            const img = `https:${$(el).find("img").attr("src")}`;

            results.push({
                id: url,
                title: title?.trim()!,
                img: img,
                altTitles: [],
                year: 0,
                format: Format.NOVEL,
                providerId: this.id
            })
        })

        return results;
    }
}