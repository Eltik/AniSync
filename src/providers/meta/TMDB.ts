import { config } from "../../config";
import Meta, { SearchResponse } from "./Meta";
import { load } from "cheerio";

export default class TMDB extends Meta {
    private config = config.mapping.provider.TMDB;
    private apiUrl = 'https://api.themoviedb.org/3';

    constructor() {
        super("https://www.themoviedb.org", "TMDB");
    }

    public async search(query:string): Promise<Array<SearchResponse>> {
        const results:SearchResponse[] = [];

        const page = 0;
        const searchUrl = `/search/multi?api_key=${this.config.api_key}&language=en-US&page=${page}&include_adult=false&query=${query}`;

        try {
            const req = await this.fetchJSON(this.baseUrl + searchUrl);
            const data:Result = req.json();
            if (data.results.length > 0) {
                data.results.forEach((result) => {
                    if (result.media_type === "tv") {
                        results.push({
                            id: "/tv/" + result.id,
                            title: result.name,
                            img: `${result.poster_path}`,
                            url: `https://www.themoviedb.org/tv/${result.id}`,
                            native: result.original_name,
                        });
                    } else if (result.media_type === "movie") {
                        results.push({
                            id: "/movie/" + result.id,
                            title: result.name,
                            img: `${result.poster_path}`,
                            url: `https://www.themoviedb.org/movie/${result.id}`,
                            native: result.original_name,
                        });
                    }
                });
                return results;
            } else {
                return results;
            }
        } catch (e) {
            throw new Error(e);
        }
    }

    // someone add interface lol thanks
    public async getInfo(id:string): Promise<any> {
        const searchUrl = `${id}?api_key=${this.config.api_key}&language=en-US&append_to_response=release_dates,watch/providers,alternative_titles,credits,external_ids,images,keywords,recommendations,reviews,similar,translations,videos&include_image_language=en`;
        try {
            const req = await this.fetchJSON(this.apiUrl + searchUrl);
            return req.json();
        } catch (e) {
            throw new Error(e);
        }
    }
}

interface Result {
    results: [Data];
}

interface Data {
    adult: boolean;
    backdrop_path: string;
    id: number;
    name: string;
    original_language: string;
    original_name: string;
    overview: string;
    poster_path: string;
    media_type: string;
    genre_ids: [string];
    popularity: number;
    first_air_date: string;
    vote_average: number;
    vote_count: number;
    origin_country: [string];
}