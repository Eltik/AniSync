import { load } from "cheerio";
import AnimeProvider, { SubType } from ".";

import axios from "axios";
import { Format, Formats, type Result } from "../..";

export default class NineAnime extends AnimeProvider {
    override rateLimit = 250;
    override id = "9anime";
    override url = "https://9anime.to";
    override formats: Format[] = [Format.MOVIE, Format.ONA, Format.OVA, Format.SPECIAL, Format.TV, Format.TV_SHORT];

    private resolver:string = process.env.NINEANIME_RESOLVER || `https://9anime.resolver.com`;
    private resolverKey:string = process.env.NINEANIME_KEY || `9anime`;

    override get subTypes(): SubType[] {
        return [SubType.SUB, SubType.DUB];
    }

    override async search(query: string): Promise<Result[] | undefined> {
        const vrf = await this.getSearchVRF(query);

        const results:Result[] = [];

        const { data } = await axios(`${this.url}/ajax/anime/search?keyword=${encodeURIComponent(query)}&${vrf.vrfQuery}=${encodeURIComponent(vrf.url)}`);

        const $ = load(data.result.html);

        $("div.items > a.item").each((i, el) => {
            const title = $(el).find("div.name");
            const altTitles:string[] = [title.attr("data-jp")!];

            const year: number = (parseInt($(el).find("div.info div.meta span.dot").last()?.text()?.trim()?.split(",")[1]) ?? 0);
            
            const formatString: string = $(el).find("div.info div.meta span.dot").eq(-2)?.text()?.trim()!;
            const format: Format = Formats.includes(formatString as Format) ? formatString as Format : Format.UNKNOWN;

            results.push({
                id: $(el).attr("href")!,
                title: title.text().trim(),
                altTitles,
                year,
                format,
                img: $(el).find("img").attr("src")!,
                providerId: this.id
            })
        });

        return results;
    }

    private async getSearchVRF(query:string): Promise<VRF> {
        return (await axios(`${this.resolver}/9anime-search?query=${encodeURIComponent(query)}&apikey=${this.resolverKey}`)).data;
    }
}

type VRF = {
    url: string;
    vrfQuery: string;
}