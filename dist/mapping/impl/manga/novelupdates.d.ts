import MangaProvider from ".";
import { Format, Result } from "../..";
export default class NovelUpdates extends MangaProvider {
    rateLimit: number;
    id: string;
    url: string;
    formats: Format[];
    search(query: string): Promise<Result[] | undefined>;
}
