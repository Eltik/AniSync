import { Format, type Result } from "../..";
export default abstract class AnimeProvider {
    abstract id: string;
    abstract url: string;
    abstract formats: Format[];
    search(query: string): Promise<Result[] | undefined>;
    abstract get subTypes(): SubType[];
}
export declare const enum SubType {
    DUB = "dub",
    SUB = "sub"
}
