import { ProviderType } from "../API";
import Provider from "../Provider";
import { Result } from "../Sync";

export default class TMDB extends Provider {
    private apiUrl = 'https://api.themoviedb.org/3';
    private api_key = "5201b54eb0968700e693a30576d7d4dc";

    constructor() {
        super("https://www.themoviedb.org", ProviderType.ANIME);
    }

    public async search(query:string): Promise<Array<Result>> {
        const results:Array<Result> = [];

        const page = 0;
        const searchUrl = `/search/multi?api_key=${this.api_key}&language=en-US&page=${page}&include_adult=false&query=${query}`;

        try {
            const req = await this.fetch(this.baseURL + searchUrl);
            const data:SearchResult = req.json();
            if (data.results.length > 0) {
                data.results.forEach((result) => {
                    if (result.media_type === "tv") {
                        results.push({
                            title: result.title || result.name,
                            altTitles: [result.original_title || result.original_name, result.title || result.name],
                            url: `https://www.themoviedb.org/tv/${result.id}`,
                        });
                    } else if (result.media_type === "movie") {
                        results.push({
                            title: result.title || result.name,
                            altTitles: [result.original_title || result.original_name, result.title || result.name],
                            url: `https://www.themoviedb.org/movie/${result.id}`,
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
        const searchUrl = `${id}?api_key=${this.api_key}&language=en-US&append_to_response=release_dates,watch/providers,alternative_titles,credits,external_ids,images,keywords,recommendations,reviews,similar,translations,videos&include_image_language=en`;
        try {
            const req = await this.fetch(this.apiUrl + searchUrl);
            const json = req.json();
            json.backdrop_path = `https://image.tmdb.org/t/p/original${json.backdrop_path}`;
            json.poster_path = `https://image.tmdb.org/t/p/original${json.poster_path}`;
            return req.json();
        } catch (e) {
            throw new Error(e);
        }
    }
}

interface SearchResult {
    results: [Data];
}

interface Data {
    adult: boolean;
    backdrop_path: string;
    id: number;
    title: string;
    name: string;
    original_language: string;
    original_title: string;
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