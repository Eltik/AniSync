import axios from "axios";
import AnimeProvider, { SubType } from ".";
import { Format, Result } from "../..";

export default class AnimePahe extends AnimeProvider {
    override id: string = "animepahe";
    override url: string = "https://animepahe.com";

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
            results.push({
                id: String(item.id) ?? item.session,
                title: item.title,
                year: item.year,
                img: item.poster,
                altTitles: [],
                providerId: this.id
            })
        });

        return results;
    }
}