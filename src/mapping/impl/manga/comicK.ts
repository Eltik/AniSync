import axios from "axios";
import MangaProvider from ".";
import { Format, Result } from "../..";

export default class ComicK extends MangaProvider {
    override id: string = "comick";
    override url: string = "https://comick.app";
    
    override formats: Format[] = [Format.MANGA, Format.ONE_SHOT];

    private api: string = "https://api.comick.app";

    override async search(query: string): Promise<Result[] | undefined> {
        const data: SearchResult[] = (await axios(`${this.api}/v1.0/search?q=${encodeURIComponent(query)}&limit=25&page=1`)).data;

        const results: Result[] = [];

        data.map((result) => {
            let cover:any = result.md_covers ? result.md_covers[0] : null;
            if (cover && cover.b2key != undefined) {
                cover = "https://meo.comick.pictures/" + cover.b2key;
            }

            results.push({
                id: result.slug,
                title: result.title ?? result.slug,
                altTitles: result.md_titles ? result.md_titles.map((title) => title.title) : [],
                img: cover,
                year: result.created_at ? new Date(result.created_at).getFullYear() : 0,
                providerId: this.id,
            });
        });
        return results;
    }
}

interface SearchResult {
    title: string;
    id: number;
    slug: string;
    rating: string;
    rating_count: number;
    follow_count: number;
    user_follow_count: number;
    content_rating: string;
    created_at: string;
    demographic: number;
    md_titles: { title: string }[];
    md_covers: { vol: any; w: number; h: number; b2key: string }[];
    highlight: string;
}