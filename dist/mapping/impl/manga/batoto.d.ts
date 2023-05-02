import MangaProvider from ".";
import { Format, Result } from "../..";
export default class BatoTo extends MangaProvider {
    id: string;
    url: string;
    formats: Format[];
    search(query: string): Promise<Result[] | undefined>;
}
