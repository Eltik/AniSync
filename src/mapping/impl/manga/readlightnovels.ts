import axios from "axios";
import MangaProvider from ".";
import { Format, Result } from "../..";
import { load } from "cheerio";

export default class ReadLightNovels extends MangaProvider {
    override rateLimit = 250;
    override id = "readlightnovels";
    override url = "https://readlightnovels.net";

    override formats: Format[] = [Format.NOVEL];

    override async search(query: string): Promise<Result[] | undefined> {
        const results: Result[] = [];

        const { data } = await axios.post(`${this.url}/?s=${encodeURIComponent(query)}`);

        const $ = load(data);

        $("div.col-xs-12.col-sm-12.col-md-9.col-truyen-main > div:nth-child(1) > div > div:nth-child(2) > div.col-md-3.col-sm-6.col-xs-6.home-truyendecu").each((i, el) => {
            results.push({
                id: $(el).find("a").attr("href")!.split(this.url)[1],
                title: $(el).find("a").attr("title")!,
                altTitles: [],
                img: $(el).find("a > img").attr("src")!,
                year: 0,
                format: Format.NOVEL,
                providerId: this.id,
            });
        });

        return results;
    }
}
