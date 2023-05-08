import AnimeProvider, { SubType } from ".";
import { Format, Result } from "../..";
export default class Zoro extends AnimeProvider {
    rateLimit: number;
    id: string;
    url: string;
    formats: Format[];
    get subTypes(): SubType[];
    search(query: string): Promise<Result[] | undefined>;
}
