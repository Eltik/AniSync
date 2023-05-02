import MangaProvider from ".";
import { Format, Result } from "../..";
export default class NovelBuddy extends MangaProvider {
    id: string;
    url: string;
    formats: Format[];
    search(query: string): Promise<Result[] | undefined>;
}
