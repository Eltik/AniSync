import Provider from "../types/Provider";
import { ProviderType } from "../types/API";
import { Result } from "../Core";
import colors from "colors";
import { Format } from "../meta/AniList";

export default class Marin extends Provider {
    constructor() {
        super("https://marin.moe", ProviderType.ANIME, [Format.MOVIE, Format.ONA, Format.OVA, Format.SPECIAL, Format.TV, Format.TV_SHORT], "Marin");
    }

    public async search(query:string): Promise<Array<Result>> {
        const token = await this.getToken();
        const req = await this.fetch(`${this.baseURL}/anime`, {
            method: "POST",
            body: { "search": query },
            headers: {
                Origin: this.baseURL,
                Referer: `${this.baseURL}/anime`,
                Cookie: `__ddg1=;__ddg2_=; XSRF-TOKEN=${token[1]}; marin_session=${token[0]};`,
                "x-xsrf-token": token[1].split(';')[0].replace("%3D", "="),
                "x-inertia": "true",
            }
        }).catch((err) => {
            return null;
        });
        if (!req) {
            return [];
        }
        const data:SearchResponse = req.json();

        if (!data.props.anime_list) {
            return [];
        }
        return data.props.anime_list.data.map((item) => ({
            title: item.title,
            url: `${this.baseURL}/anime/${item.slug}`
        }));
    }

    private async getToken(): Promise<string[]> {
        let token: string[] = [];

        let response = await this.fetch(`${this.baseURL}/anime`, {
            headers: {
                Referer: `${this.baseURL}/anime`,
                Cookie: '__ddg1_=;__ddg2_=;',
            },
        });

        token.push(response.headers['set-cookie']![1].replace('marin_session=', ''));
        token.push(response.headers['set-cookie']![0].replace('XSRF-TOKEN=', ''));

        return token;
    }
}

interface SearchResponse {
    component: string;
    props: {
        errors: any;
        anime_list: {
            data: [{
                title: string;
                slug: string;
                cover: string;
                type: string;
                year: string;
            }];
            links: {
                first: string;
                last: string;
                next: string|null;
                prev: string|null;
            };
            meta: {
                current_page: number;
                from: number;
                last_page: number;
                per_page: number;
                to: number;
                total: number;
                path: string;
                links: [{
                    url: string|null;
                    label: string;
                    active: boolean;
                }];
            };
        };
        disqus: {
            shortname: string;
            enabled: boolean;
        };
        search_tax: string;
        sort_list: {
            "add-a": string;
            "add-d": string;
            "az-a": string;
            "az-d": string;
            "rel-a": string;
            "rel-d": string;
            "vdy-a": string;
            "vdy-d": string;
            "vmt-a": string;
            "vmt-d": string;
            "vtt-a": string;
            "vtt-d": string;
            "vwk-a": string;
            "vwk-d": string;
            "vyr-a": string;
            "vyr-d": string;
        };
        taxonomy_list: any;
    };
    url: string;
    version: string;
}