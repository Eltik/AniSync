import { ProviderType } from "../types/API";
import Provider from "../types/Provider";
import { Result } from "../Core";
import { Format } from "../meta/AniList";

export default class ComicK extends Provider {
    private api:string = "https://api.comick.app";
    private image:string = "https://meo.comick.pictures";

    constructor() {
        super("https://comick.app", ProviderType.MANGA, [Format.MANGA, Format.ONE_SHOT], "ComicK");
        this.rateLimit = 250;
    }

    public async search(query:string): Promise<Array<Result>> {
        const data = await this.fetch(`${this.api}/v1.0/search?q=${encodeURIComponent(query)}&limit=25&page=1`);
        const json = data.json();
        const results = json.map((result:SearchResult) => {
            let cover:any = result.md_covers ? result.md_covers[0] : null;
            if (cover && cover.b2key != undefined) {
                cover = this.image + "/" + cover.b2key;
            }
            // There are alt titles in the md_titles array
            return {
                url: this.baseURL + "/comic/" + result.slug,
                id: result.slug,
                title: result.title ?? result.slug,
                altTitles: result.md_titles ? result.md_titles.map((title) => title.title) : [],
                img: cover,
            };
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
    demographic: number;
    md_titles: [MDTitle];
    md_covers: Array<Cover>;
    highlight: string;
}

interface Cover {
    vol: any;
    w: number;
    h: number;
    b2key: string;
}

interface MDTitle {
    title: string;
}