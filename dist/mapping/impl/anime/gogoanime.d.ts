import AnimeProvider, { SubType } from ".";
import { Format, Result } from "../..";
export default class GogoAnime extends AnimeProvider {
    rateLimit: number;
    id: string;
    url: string;
    formats: Format[];
    get subTypes(): SubType[];
    search(query: string): Promise<Result[] | undefined>;
}
