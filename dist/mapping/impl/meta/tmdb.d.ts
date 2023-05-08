import { Format, Result } from "../..";
import MetaProvider from ".";
export default class TMDB extends MetaProvider {
    rateLimit: number;
    id: string;
    url: string;
    formats: Format[];
    private tmdbApiUrl;
    private apiKey;
    search(query: string): Promise<Result[] | undefined>;
}
