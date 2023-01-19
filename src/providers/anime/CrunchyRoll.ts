import * as colors from "colors";
import { config } from "../../config";
import Anime, { SearchResponse } from "./Anime";
import Cronchy from "cronchy";

export default class CrunchyRoll extends Anime {
    private credentials:Credentials;
    private config = config.mapping.provider.CrunchyRoll;
    private cronchy:Cronchy;
    public hasInit = false;

    constructor() {
        super("https://www.crunchyroll.com", "CrunchyRoll");
        this.credentials = {
            email: this.config.email,
            password: this.config.password
        }
        this.cronchy = new Cronchy(this.credentials.email, this.credentials.password);
    }

    public async init() {
        await this.cronchy.login();
        this.hasInit = true;
        setInterval(() => {
            this.cronchy.login();
        }, 25000)
        return this.cronchy;
    }

    public async search(query:string): Promise<Array<SearchResponse>> {
        const results = [];
        const json:CrunchySearchResponse = await this.cronchy.search(encodeURIComponent(query), 8).catch((err) => {
            return null;
        });

        if (!json) {
            if (config.crawling.debug) {
                console.log(colors.cyan("[CrunchyRoll]") + colors.red("Unable to fetch data for " + colors.white(query) + "."));
            }
            return [];
        }

        const data:Data[] = json.data;
        const item = data[1] ? data[1] : data[0];
        const items:Item[] = item ? item.items : null;
        if (!items) {
            console.log(colors.cyan("[CrunchyRoll]") + colors.red("Unable to parse data for " + query + "."));
            return [];
        }
        items.map((item, index) => {
            const images = item.images.poster_tall;
            const url = `${this.baseUrl}/series/${item.id}`;
            const id = `/series/${item.id}`;
            const title = item.title;
            const img = images[0][images.length - 1].source;

            results.push({
                url,
                id,
                title,
                img
            });
        })
        return results;
    }
}

interface CrunchySearchResponse {
    total: number;
    data: Data[];
}

interface Data {
    type: string;
    count: number;
    items: [Item];
}

interface Item {
    title: string;
    description: string;
    slug: string;
    slug_title: string;
    linked_resource_key: string;
    promo_title: string;
    type: "series"|"objects"|"movie_listing"|"episode"|"top_results";
    series_metadata: {
        audio_locales: [string]
        availability_notes: string;
        episode_count: number;
        extended_description: string;
        extended_maturity_rating: any;
        is_dubbed: boolean;
        is_subbed: boolean;
        is_mature: boolean;
        is_simulcast: boolean;
        mature_blocked: boolean;
        maturity_ratings: [string]
        season_count: number;
        series_launch_year: number;
        subtitle_locales: [string];
        tenant_categories: [string]; // Genres
    };
    new: boolean;
    search_metadata: {
        score: number;
    };
    external_id: string;
    promo_description: string;
    channel_id: string;
    images: {
        poster_tall: [Poster[]];
        poster_wide: [Poster[]];
    }
    id: string;
}

interface Poster {
    height: number;
    source: string;
    type: "poster_tall"|"poster_wide";
    width: number;
}

interface Credentials {
    email: string;
    password: string;
}