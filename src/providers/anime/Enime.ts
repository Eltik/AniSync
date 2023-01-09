import Anime, { SearchResponse } from "./Anime";

export default class Enime extends Anime {
    private api = 'https://api.enime.moe';

    constructor() {
        super("https://enime.moe", "Enime");
    }

    public async search(query:string): Promise<Array<SearchResponse>> {
        const page = 0;
        const perPage = 18;

        const req = await this.fetchJSON(`${this.api}/search/${query}?page=${page}&perPage=${perPage}`);
        const data = req.json();
        return data.data.map((item:any) => ({
            id: item.id,
            title: item.title.english ?? item.title.romaji ?? item.title.native,
            romaji: item.title.romaji,
            native: item.title.native,
            img: item.coverImage,
        }));
    }
}