import API, { ProviderType } from "./API";

export default class Provider extends API {
    public baseURL:string;
    public providerType:ProviderType;

    constructor(baseURL:string, type:ProviderType) {
        super(type);
        this.baseURL = baseURL;
        this.providerType = type;
    }
}