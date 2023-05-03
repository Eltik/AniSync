import axios from "axios";
import AnimeProvider, { SubType } from ".";
import { Format, Result } from "../..";
import { load } from "cheerio";

export default class GogoAnime extends AnimeProvider {
    override id: string = "gogoanime";
    override url: string = "https://gogoanime.cl";

    override formats: Format[] = [Format.MOVIE, Format.ONA, Format.OVA, Format.SPECIAL, Format.TV, Format.TV_SHORT];

    override get subTypes(): SubType[] {
        return [SubType.SUB, SubType.DUB];
    }

    override async search(query: string): Promise<Result[] | undefined> {
        const { data } = await axios(`${this.url}/search.html?keyword=${encodeURIComponent(query)}`);
        const results: Result[] = [];

        const $ = load(data);
        
        $("ul.items > li").map((i, el) => {
            const title = $(el).find("div.img a").attr("title")!.trim().replace(/\\n/g, "");
            const id = $(el).find("div.img a").attr("href")!;
            const year = (parseInt($("p.released").text()?.split("Released: ")[1]) ?? 0);
            const img = $(el).find("div.img a img").attr("src")!;

            results.push({
                id: id,
                title: title,
                altTitles: [],
                img: img,
                year: year,
                providerId: this.id
            })
        })

        return results;
    }
}