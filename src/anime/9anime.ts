import Provider from "../types/Provider";
import { ProviderType } from "../types/API";
import { Result } from "../Core";
import { load } from "cheerio";
import colors from "colors";
import { Format } from "../meta/AniList";

export default class NineAnime extends Provider {
    // Requires a custom IP for requests
    private url:string = process.env.NINEANIME || this.baseURL;
    private proxy:string = process.env.NINEANIME_RESOLVER || `https://proxy.vnxservers.com`;
    private proxyKey:string = process.env.NINEANIME_KEY || `9anime`;

    constructor() {
        super(process.env.NINEANIME || "https://9anime.pl", ProviderType.ANIME, [Format.MOVIE, Format.ONA, Format.OVA, Format.SPECIAL, Format.TV, Format.TV_SHORT], "9anime");
    }

    public async search(query:string): Promise<Array<Result>> {
        const vrf = await this.getSearchVRF(query).catch((err) => {
            return {
                url: "",
                vrfQuery: ""
            };
        });

        const results:Result[] = [];
        if (vrf.url.length === 0) {
            return results;
        }
        
        const req = await this.fetch(`${this.url}/ajax/anime/search?keyword=${encodeURIComponent(query)}&${vrf.vrfQuery}=${encodeURIComponent(vrf.url)}`, { bypassWaf: true });
        const data = req.json();

        const $ = load(data.result.html);
        $("div.items > a.item").each((i, el) => {
            const title = $(el).find("div.name");

            const altTitles = [];
            if (title.attr("data-jp")) {
                altTitles.push(title.attr("data-jp")!);
            }
            results.push({
                url: `${this.baseURL}${$(el).attr("href")}`,
                title: title.text().trim(),
                img: $(el).find("img").attr("src"),
                altTitles: altTitles,
            })
        });

        return results;
    }

    private async getVRF(query:string): Promise<VRFQuery> {
        const req = await this.fetch(`${this.proxy}/vrf?query=${encodeURIComponent(query)}&apikey=${this.proxyKey}`).catch((err) => {
            console.error(colors.red("Error getting VRF."));
            console.error(err.message);
            return null;
        });
        if (!req) {
            return {
                url: "",
                vrfQuery: ""
            };
        }
        return req.json();
    }

    private async getSearchVRF(query:string): Promise<VRFQuery> {
        const req = await this.fetch(`${this.proxy}/9anime-search?query=${encodeURIComponent(query)}&apikey=${this.proxyKey}`).catch((err) => {
            console.error(colors.red("Error getting search VRF."));
            console.error(err.message);
            return null;
        });
        if (!req) {
            return {
                url: "",
                vrfQuery: ""
            };
        }
        return req.json();
    }
}

interface VRFQuery {
    url: string;
    vrfQuery: string;
}