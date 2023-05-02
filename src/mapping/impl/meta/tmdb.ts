import axios from "axios";
import { Format, Result } from "../..";
import MetaProvider from ".";

export default class TMDB extends MetaProvider {
    override id: string = "tmdb";
    override url: string = "https://themoviedb.org";
    override formats: Format[] = [Format.TV, Format.MOVIE, Format.ONA, Format.SPECIAL, Format.TV_SHORT, Format.OVA];

    private tmdbApiUrl = "https://api.themoviedb.org/3";
    private apiKey = "5201b54eb0968700e693a30576d7d4dc";
    
    override async search(query: string): Promise<Result[] | undefined> {
        const results:Result[] = [];

        const page = 0;
        const searchUrl = `/search/multi?api_key=${this.apiKey}&language=en-US&page=${page}&include_adult=false&query=${encodeURIComponent(query)}`;

        const { data } = await axios(this.url + searchUrl);
        if (data.results.length > 0) {
            data.results.forEach((result) => {
                if (result.media_type === "tv") {
                    results.push({
                        id: `/tv/${result.id}`,
                        title: result.title || result.name,
                        altTitles: [result.original_title || result.original_name, result.title || result.name],
                        img: `https://image.tmdb.org/t/p/w500${result.poster_path}`,
                        providerId: this.id,
                    });
                } else if (result.media_type === "movie") {
                    results.push({
                        id: `/movie/${result.id}`,
                        title: result.title || result.name,
                        altTitles: [result.original_title || result.original_name, result.title || result.name],
                        img: `https://image.tmdb.org/t/p/w500${result.poster_path}`,
                        providerId: this.id,
                    });
                }
            });
            return results;
        } else {
            return results;
        }
    }
}