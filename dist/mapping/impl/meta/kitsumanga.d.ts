import { Format, Result } from "../..";
import MetaProvider from ".";
export default class KitsuManga extends MetaProvider {
    rateLimit: number;
    id: string;
    url: string;
    formats: Format[];
    private kitsuApiUrl;
    search(query: string): Promise<Result[] | undefined>;
}
