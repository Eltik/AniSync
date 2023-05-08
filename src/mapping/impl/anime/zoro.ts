import axios from "axios";
import AnimeProvider, { SubType } from ".";
import { Format, Formats, Result } from "../..";
import { load } from "cheerio";

export default class Zoro extends AnimeProvider {
    override rateLimit = 250;
    override id = "zoro";
    override url = "https://zoro.to";

    override formats: Format[] = [Format.MOVIE, Format.ONA, Format.OVA, Format.SPECIAL, Format.TV, Format.TV_SHORT];

    override get subTypes(): SubType[] {
        return [SubType.SUB, SubType.DUB];
    }

    override async search(query: string): Promise<Result[] | undefined> {
        const { data } = await axios(`${this.url}/search?keyword=${encodeURIComponent(query)}`);
        const results: Result[] = [];

        const $ = load(data);
        
        $(".film_list-wrap > div.flw-item").map((i, el) => {
            const title = $(el).find("div.film-detail h3.film-name a.dynamic-name").attr("title")!.trim().replace(/\\n/g, "");
            const id = $(el).find("div:nth-child(1) > a").last().attr("href")!;
            const img = $(el).find("img").attr("data-src")!;

            const altTitles: string[] = [];
            const jpName = $(el).find("div.film-detail h3.film-name a.dynamic-name").attr("data-jname")!.trim().replace(/\\n/g, "");
            altTitles.push(jpName);

            const formatString: string = $(el).find("div.film-detail div.fd-infor span.fdi-item")?.first()?.text().toUpperCase();
            const format: Format = Formats.includes(formatString as Format) ? formatString as Format : Format.UNKNOWN;

            results.push({
                id: id,
                title: title,
                altTitles: altTitles,
                year: 0,
                format,
                img: img,
                providerId: this.id
            })
        })

        return results;
    }
}