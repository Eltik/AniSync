import { ProviderType } from "../types/API";
import Provider from "../types/Provider";
import { Result } from "../Core";
import { Format } from "./AniList";

export default class TMDB extends Provider {
    private apiUrl = 'https://api.themoviedb.org/3';
    private api_key = "5201b54eb0968700e693a30576d7d4dc";

    constructor() {
        super("https://www.themoviedb.org", ProviderType.ANIME, [Format.MOVIE, Format.ONA, Format.OVA, Format.SPECIAL, Format.TV, Format.TV_SHORT], "TMDB");
        this.rateLimit = 500;
    }

    public async search(query:string): Promise<Array<Result>> {
        const results:Array<Result> = [];

        const page = 0;
        const searchUrl = `/search/multi?api_key=${this.api_key}&language=en-US&page=${page}&include_adult=false&query=${encodeURIComponent(query)}`;

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

    /**
     * @description Fetches the info for a given TMDB ID
     * @param id TMDB ID. Ex. /tv/119495
     * @returns 
     */
    public async getInfo(id:string): Promise<any> {
        const searchUrl = `${id}?api_key=${this.api_key}&language=en-US&append_to_response=release_dates,watch/providers,alternative_titles,credits,external_ids,images,keywords,recommendations,reviews,similar,translations,videos&include_image_language=en`;
        try {
            const req = await this.fetch(this.apiUrl + searchUrl).catch((err) => {
                return null;
            });
            if (!req) {
                return null;
            }
            const json = req.json();
            if (!json) {
                return null;
            }
            json.backdrop_path = json.backdrop_path.startsWith("https://image.tmdb") ? json.backdrop_path : `https://image.tmdb.org/t/p/original${json.backdrop_path}`;
            json.poster_path = json.backdrop_path.startsWith("https://image.tmdb") ? json.backdrop_path : `https://image.tmdb.org/t/p/original${json.poster_path}`;
            return req.json();
        } catch (e) {
            throw new Error(e);
        }
    }

    /**
     * @description Fetches episode covers for a given season
     * @param id TMDB ID. Ex. /tv/119495
     * @param seasonNumber Season number
     */
    public async getEpisodeCovers(id:string, seasonNumber:number): Promise<any> {
        const seasonUrl = `${id}/season/${seasonNumber}?api_key=${this.api_key}`;
        try {
            const req = await this.fetch(this.apiUrl + seasonUrl);
            const data = req.json();
            const episodes = data.episodes;
            const episodeCovers = [];
            if (!episodes) {
                return [];
            }
            episodes.forEach((episode) => {
                if (episode.still_path != null) {
                    episodeCovers.push({
                        episode: episode.episode_number,
                        img: `https://image.tmdb.org/t/p/original${episode.still_path}`,
                    });
                }
            });
            return episodeCovers;
        } catch (e) {
            throw new Error(e);
        }
    }

    public async tvdbToTMDB(id:string): Promise<any> {
        const searchUrl = `${this.apiUrl}/3/find${id}?api_key=${this.api_key}&external_source=tvdb_id`;
        try {
            const req = await this.fetch(this.apiUrl + searchUrl);
            const data = req.json();
            const id = data.tv_results[0] ? data.tv_results[0].id : null;
            return id;
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