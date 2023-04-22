import Provider from "../types/Provider";
import { Result } from "../Core";
import { load } from "cheerio";
import { ProviderType } from "../types/API";
import { Format } from "../meta/AniList";

export default class NovelUpdates extends Provider {
    constructor() {
        super("https://www.novelupdates.com", ProviderType.MANGA, [Format.NOVEL], "NovelUpdates");
        this.rateLimit = 500;
    }

    public async search(query:string): Promise<Array<Result>> {
        const results:Result[] = [];

        const req = await this.fetch(`${this.baseURL}/wp-admin/admin-ajax.php`, {
            method: "POST",
            body: {
                action: "nd_ajaxsearchmain",
                strType: "desktop",
                strOne: query,
                strSearchType: "series"
            },
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Referer: this.baseURL,
                "X-Requested-With": "XMLHttpRequest"
            },
            useCFBypass: true
        });
        const $ = load(req.text());
        $("ul li").map((i, el) => {
            const url = $(el).find("a").attr("href");
            const img = $(el).find("img").attr("src");
            const title = $(el).find("a").text();
            results.push({
                url: url,
                img: "https:" + img,
                title: title?.trim()
            })
        })
        return results;
    }

    public async getInfo(id:string): Promise<InfoData> {
        if (id.startsWith(this.baseURL)) {
            id = id.split(this.baseURL)[1];
        }

        const req = await this.fetch(`${this.baseURL}${id}`, { useCFBypass: true });
        const $ = load(req.text());
        
        const title = $("div.seriestitlenu").text();
        const description = $("div#editdescription p").text();

        const tags = [];
        $("div#showtags a").map((i, el) => {
            tags.push({
                name: $(el).text(),
                url: $(el).attr("href")
            })
        })

        const maxChapterPages = $("div.digg_pagination a").length;
        
        const chapters: { url:string, id:string, title: string }[] = [];
        
        $("table#myTable tbody tr").map((i, el) => {
            const url = "https:" + $(el).find("a.chp-release").attr("href");
            const title = $(el).find("a.chp-release").attr("title");
            chapters.push({
                url,
                id: url.split(this.baseURL)[1],
                title
            });
        })
        for (let i = 1; i < Number(maxChapterPages); i++) {
            const req = await this.fetch(`${this.baseURL}${id}?pg=${i + 1}#myTable`, { useCFBypass: true });
            const $$ = load(req.text());
            $$("table#myTable tbody tr").map((i, el) => {
                const url = "https:" + $$(el).find("a.chp-release").attr("href");
                const title = $$(el).find("a.chp-release").attr("title");
                chapters.push({
                    url,
                    id: url.split(this.baseURL)[1],
                    title
                });
            })
        }

        return {
            title,
            description,
            tags,
            chapters,
            maxChapterPages
        }
    }
}

interface InfoData {
    title: string;
    description: string;
    tags: string[];
    chapters: { url:string, id:string, title: string }[];
    maxChapterPages: number;
}

export type { InfoData }