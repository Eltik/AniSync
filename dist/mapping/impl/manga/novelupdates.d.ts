import MangaProvider from ".";
import { Format, Result } from "../..";
export default class NovelUpdates extends MangaProvider {
    id: string;
    url: string;
    formats: Format[];
    private cfbypass;
    search(query: string): Promise<Result[] | undefined>;
}
