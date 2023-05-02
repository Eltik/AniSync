import AnimeProvider, { SubType } from ".";
import { Format, type Result } from "../..";
export default class NineAnime extends AnimeProvider {
    id: string;
    url: string;
    formats: Format[];
    private resolver;
    private resolverKey;
    get subTypes(): SubType[];
    search(query: string): Promise<Result[] | undefined>;
    private getSearchVRF;
}
