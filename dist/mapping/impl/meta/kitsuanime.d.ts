import { Format, Result } from "../..";
import MetaProvider from ".";
export default class KitsuAnime extends MetaProvider {
    id: string;
    url: string;
    formats: Format[];
    private kitsuApiUrl;
    search(query: string): Promise<Result[] | undefined>;
}
