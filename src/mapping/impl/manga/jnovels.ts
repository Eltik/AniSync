import axios from "axios";
import MangaProvider from ".";
import { Format, Result } from "../..";
import { load } from "cheerio";
import { compareTwoStrings } from "@/src/helper/stringSimilarity";

export default class JNovels extends MangaProvider {
    override rateLimit = 250;
    override id = "jnovels";
    override url = "https://jnovels.com";
    
    override formats: Format[] = [Format.NOVEL];

    override async search(query: string): Promise<Result[] | undefined> {
        const results:Result[] = [];
        const list:Result[] = [];

        const req = await axios(`${this.url}/11light-1novel20-pdf/`);
        const $ = load(req.data);

        $("div.post-content ol li").map((i, el) => {
            const id = $(el).find("a").attr("href")?.split(this.url)[1]!;
            const title = $(el).find("a").text()?.trim() ?? "";

            list.push({
                id: id,
                title: title,
                altTitles: [],
                img: null,
                year: 0,
                format: Format.NOVEL,
                providerId: this.id
            })
        })

        for (const result of list) {
            if (compareTwoStrings(query, result.title) > 0.3) {
                results.push(result);
            }
        }

        if (results.length === 0) {
            const req = await axios(`${this.url}/hwebnovels-lista14/`);
            const $ = load(req.data);

            $("div.post-content ol li").map((i, el) => {
                const id = $(el).find("a").attr("href")!.split(this.url)[1]!;
                const title = $(el).find("a").text()?.trim() ?? "";

                list.push({
                    id: id,
                    title: title,
                    altTitles: [],
                    img: null,
                    year: 0,
                    format: Format.NOVEL,
                    providerId: this.id
                })
            })

            for (const result of list) {
                if (compareTwoStrings(query, result.title) > 0.3) {
                    results.push(result);
                }
            }
        }

        return results;
    }
}