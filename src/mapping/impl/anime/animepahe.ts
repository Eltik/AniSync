import axios from "axios";
import AnimeProvider, { SubType } from ".";
import { Format, Formats, Result } from "../..";

export default class AnimePahe extends AnimeProvider {
    override rateLimit = 250;
    override id = "animepahe";
    override url = "https://animepahe.com";

    override formats: Format[] = [Format.MOVIE, Format.ONA, Format.OVA, Format.SPECIAL, Format.TV, Format.TV_SHORT];

    override get subTypes(): SubType[] {
        return [SubType.SUB, SubType.DUB];
    }

    override async search(query: string): Promise<Result[] | undefined> {
        const { data } = await axios(`${this.url}/api?m=search&q=${encodeURIComponent(query)}`);
        const results: Result[] = [];

        if (!data.data) {
            return [];
        }

        data.data.map((item) => {
            const formatString: string = item.type.toUpperCase();
            const format: Format = Formats.includes(formatString as Format) ? formatString as Format : Format.UNKNOWN;

            results.push({
                id: String(item.id) ?? item.session,
                title: item.title,
                year: item.year,
                img: item.poster,
                format,
                altTitles: [],
                providerId: this.id
            })
        });

        return results;
    }
}