import { Format, type Result } from "../..";

export default abstract class AnimeProvider {
    abstract rateLimit: number;
    abstract id: string;
    abstract url: string;
    abstract formats: Format[];

    async search(query: string): Promise<Result[] | undefined> {
        return undefined;
    }

    abstract get subTypes(): SubType[];
}

export const enum SubType {
    DUB = 'dub',
    SUB = 'sub'
}