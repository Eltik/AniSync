import API, { ProviderType } from "../../API";

export default class Meta extends API {
    public baseUrl:string = undefined;
    public providerName:string = undefined;

    constructor(baseUrl:string, providerName:string) {
        super(ProviderType.META);
        this.baseUrl = baseUrl;
        this.providerName = providerName;
    }

    public async search(any?): Promise<SearchResponse[]> {
        throw new Error("Method not implemented.");
    }
}

interface SearchResponse {
    url: string;
    id: string;
    img: string;
    title: string;
    romaji?: string;
    native?: string;
}

export type { SearchResponse }