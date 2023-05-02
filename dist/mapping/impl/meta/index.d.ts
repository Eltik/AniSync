import { Format, Result, Type } from "../..";
export default abstract class MetaProvider {
    abstract id: string;
    abstract url: string;
    abstract formats: Format[];
    search(query: string, type: Type): Promise<Result[] | undefined>;
}
