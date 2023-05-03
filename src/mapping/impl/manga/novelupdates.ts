import MangaProvider from ".";
import { Format, Result } from "../..";
import { load } from "cheerio";
import CF from "cfbypass";

export default class NovelUpdates extends MangaProvider {
    override id: string = "novelupdates";
    override url: string = "https://www.novelupdates.com";
    
    override formats: Format[] = [Format.NOVEL];

    private cfbypass = new CF(((process.env.USE_PYTHON3 as string).toLowerCase() == "true" ? true : false) || false);

    override async search(query: string): Promise<Result[] | undefined> {
        const results: Result[] = [];

        const body:any = {
            action: "nd_ajaxsearchmain",
            strType: "desktop",
            strOne: query,
            strSearchType: "series"
        }

        const req = await this.cfbypass.request({
            url: `${this.url}/wp-admin/admin-ajax.php`,
            options: {
                method: "POST",
                body: body,
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Referer: this.url,
                    "X-Requested-With": "XMLHttpRequest"
                }
            }
        });

        const $ = load(req.text());

        $("ul li").map((i, el) => {
            const url = `${$(el).find("a").attr("href")}`;
            const title = $(el).text();
            const img = `https:${$(el).find("img").attr("src")}`;

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