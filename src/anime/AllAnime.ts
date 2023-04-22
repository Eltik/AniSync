import Provider from "../types/Provider";
import { ProviderType } from "../types/API";
import { Result } from "../Core";
import { Format } from "../meta/AniList";

export default class AllAnime extends Provider {
    private api:string = "https://api.allanime.to"

    constructor() {
        super("https://allanime.to", ProviderType.ANIME, [Format.MOVIE, Format.ONA, Format.OVA, Format.SPECIAL, Format.TV, Format.TV_SHORT], "Zoro");
    }

    public async search(query:string): Promise<Array<Result>> {
        const req = await this.graphQlQuery({
            search: {
                query: query,
                allowAdult: false,
                allowUnknown: false
            },
            translationType: "sub"
        },
        "b645a686b1988327795e1203867ed24f27c6338b41e5e3412fc1478a8ab6774e");

        const results:Result[] = [];

        const data:SearchResponse = req.json();
        data.data.shows.edges.map((show) => {
            const url = `${this.baseURL}/anime/${show._id}`;
            const title = show.englishName ?? show.name ?? show.nativeName;

            const altTitles = [];

            if (show.nativeName) {
                altTitles.push(show.nativeName);
            }
            if (show.englishName) {
                altTitles.push(show.englishName);
            }
            altTitles.push(show.name);

            results.push({
                title: title,
                url: url,
                altTitles: altTitles,
                img: show.thumbnail
            })
        });

        return results;
    }

    private async graphQlQuery(variables:any, hash:string): Promise<any> {
        const req = await this.fetch(`${this.api}/allanimeapi?variables=${encodeURIComponent(JSON.stringify(variables
        ))}&extensions=${encodeURIComponent(JSON.stringify({
            persistedQuery: { version: 1, sha256Hash: hash }
        }))}`);
        return req;
    }
}

interface SearchResponse {
    data: {
        shows: {
            pageInfo: {
                total: number;
            };
            edges: [{
                _id: string;
                name: string;
                englishName: string;
                nativeName: string;
                slugTime: string;
                thumbnail: string;
                lastEpisodeInfo: {
                    sub: {
                        episodeString?: string;
                        notes?: string;
                    };
                    dub: {
                        episodeString?: string;
                        notes?: string;
                    };
                    raw: {
                        episodeString?: string;
                        notes?: string;
                    };
                };
                lastEpisodeDate: {
                    sub: {
                        hour?: number;
                        minute?: number;
                        year?: number;
                        month?: number;
                        date?: number;
                    };
                    dub: {
                        hour?: number;
                        minute?: number;
                        year?: number;
                        month?: number;
                        date?: number;
                    };
                    raw: {
                        hour?: number;
                        minute?: number;
                        year?: number;
                        month?: number;
                        date?: number;
                    };
                };
                type: string;
                season: {
                    quarter?: string;
                    year?: number;
                };
                score: number;
                airedStart: {
                    hour?: number;
                    minute?: number;
                    year?: number;
                    month?: number;
                    date?: number;
                };
                availableEpisodes: {
                    sub: number;
                    dub: number;
                    raw: number;
                };
                episodeDuration: string;
                episodeCount: string;
                lastUpdateEnd: string;
            }];
        };
    };
}