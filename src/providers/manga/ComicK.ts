import Manga, { SearchResponse } from "./Manga";

export default class ComicK extends Manga {
    private api:string = "https://api.comick.app";
    private image:string = "https://meo.comick.pictures";

    constructor() {
        super("https://comick.app", "ComicK");
    }

    public async search(query:string): Promise<Array<SearchResponse>> {
        const data = await this.fetch(`${this.api}/search?q=${encodeURIComponent(query)}`);
        const json = data.json();
        const results = json.map((result:SearchResult) => {
            let cover:any = result.md_covers ? result.md_covers[0] : null;
            if (cover && cover.b2key != undefined) {
                cover = this.image + cover.b2key;
            }
            // There are alt titles in the md_titles array
            return {
                url: this.baseUrl + "/comic/" + result.slug,
                id: "/comic/" + result.slug,
                img: cover,
                title: result.title ? result.title : result.slug
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