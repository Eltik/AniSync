import API, { ProviderType } from "./API";
import { Format } from "../meta/AniList";

export default class Provider extends API {
    public baseURL:string;
    public altURLs:string[] = [];
    public name:string;
    public rateLimit:number = 0;
    public providerType:ProviderType;
    public formats:Format[] = [];

    constructor(baseURL:string, type:ProviderType, formats:Format[], name:string) {
        super(type);
        this.baseURL = baseURL;
        this.providerType = type;
        this.name = name;
        this.formats = formats;
    }
}