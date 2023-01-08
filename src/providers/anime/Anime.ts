import { join } from "path";
import API from "../../API";
import { Database } from "sqlite3";
import AniSync from "../../AniSync";
import { config } from "../../config";

export default class Anime extends API {
    public baseUrl:string = undefined;
    public providerName:string = undefined;

    private db = new Database(join(__dirname, "../db.db"));

    public AGGREGATORS = {
        ZoroTo: "https://zoro.to",
        Crunchyroll: "https://crunchyroll.com"
    }

    constructor(baseUrl:string, providerName:string) {
        super();
        this.baseUrl = baseUrl;
        this.providerName = providerName;
    }

    public async search(any?): Promise<SearchResponse[]> {
        throw new Error("Method not implemented.");
    }
}

interface SearchResponse {
    url: string;
    id: string;
    img: string;
    title: string;
    romaji?: string;
    native?: string;
}

export type { SearchResponse };