import axios from "axios";
import MangaProvider from ".";
import { Format, Result } from "../..";
import { load } from "cheerio";

export default class BatoTo extends MangaProvider {
    override rateLimit = 250;
    override id = "batoto";
    override url = "https://bato.to";

    override formats: Format[] = [Format.MANGA, Format.ONE_SHOT];

    override async search(query: string): Promise<Result[] | undefined> {
        const results: Result[] = [];
        const { data } = await axios(`${this.url}/search?word=${encodeURIComponent(query)}`);

        const $ = load(data);
        $("div#series-list div.item").each((i, el) => {
            const id = $(el).find("a").attr("href")!;
            const title = $(el).find("a.item-title").text();
            const altTitles: string[] = [];

            const altTitleText = $(el).find("div.item-alias").first().text();

            altTitleText.split("/").map((altTitle) => {
                altTitles.push(altTitle.trim());
            });

            const img = $(el).find("img").attr("src")!;

            results.push({
                id,
                altTitles,
                img,
                title,
                year: 0,
                format: Format.UNKNOWN,
                providerId: this.id,
            });
        });

        return results;
    }
}
