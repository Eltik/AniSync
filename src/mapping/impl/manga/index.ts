import { Format, type Result } from "../..";

export default abstract class MangaProvider {
    abstract rateLimit: number;
    abstract id: string;
    abstract url: string;
    abstract formats: Format[];

    async search(query: string): Promise<Result[] | undefined> {
        return undefined;
    }
}