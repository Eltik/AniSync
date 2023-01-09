import API from "./API";
import StringSimilarity from "./libraries/StringSimilarity";
import { config } from "./config";
import ZoroTo from "./providers/anime/ZoroTo";
import CrunchyRoll from "./providers/anime/CrunchyRoll";
import AniList, { Media, Type } from "./AniList";
import { SearchResponse } from "./providers/anime/Anime";

export default class AniSync extends API {
    private stringSim:StringSimilarity = new StringSimilarity();
    private config = config.mapping;
    
    constructor() {
        super();
    }

    // You want to search the database first, but since that hasn't been setup yet, we'll just search the providers.
    public async search(query:string, type:Type["ANIME"]|Type["MANGA"]): Promise<Result[]> {
        const promises = [];

        if (type === "ANIME") {
            const aniData:Media[] = [null];

            // Most likely will have to change TV to MOVIE, OVA, etc.
            const aniList = new AniList("", type, "TV");
            
            const aniListPromise = new Promise((resolve, reject) => {
                aniList.search(query).then((result) => {
                    const data = result.data.Page.media;
                    aniData.push(...data);
                    resolve(aniData);
                });
            });

            const aggregatorData:AggregatorData[] = await this.fetchData(query, type);

            promises.push(aniListPromise);
            await Promise.all(promises);
            
            const comparison:Search[] = [];
            aggregatorData.map((result, index) => {
                const provider = result.provider_name;
                const results = result.results;

                for (let i = 0; i < results.length; i++) {
                    const data = this.compareAnime(results[i], aniData, config.mapping.anime[provider].threshold, config.mapping.anime[provider].comparison_threshold);
                    if (data != undefined) {
                        comparison.push({
                            provider,
                            data
                        });
                    }
                }
            });

            const result = this.formatAnimeData(comparison);
            return result;
        } else {
            throw new Error("Manga is not supported yet.");
        }
    }

    public async getTrending(type:Type["ANIME"]|Type["MANGA"]) {
        
    }

    public async crawl() {
        throw new Error("Not implemented yet.");
    }

    private async fetchData(query:string, type:Type["ANIME"]|Type["MANGA"]):Promise<AggregatorData[]> {
        const promises = [];
        if (type === "ANIME") {
            const zoro = new ZoroTo();
            const crunchy = new CrunchyRoll();

            const aggregatorData:AggregatorData[] = [];

            const zoroPromise = new Promise((resolve, reject) => {
                zoro.search(query).then((results) => {
                    aggregatorData.push({
                        provider_name: zoro.providerName,
                        results: results
                    });
                    resolve(aggregatorData);
                }).catch((err) => {
                    reject(err);
                });
            });
            const crunchyPromise = new Promise((resolve, reject) => {
                crunchy.init().then(() => {
                    crunchy.search(query).then((results) => {
                        aggregatorData.push({
                            provider_name: crunchy.providerName,
                            results: results
                        });
                        resolve(aggregatorData);
                    }).catch((err) => {
                        reject(err);
                    });
                })
            })

            promises.push(zoroPromise);
            promises.push(crunchyPromise);
            await Promise.all(promises);
            return aggregatorData;
        } else {
            throw new Error("Manga is not supported yet.");
        }
    }

    // Formats search results into singular AniList data. Assigns each provider to an AniList object.
    public formatAnimeData(results:Search[]):Result[] {
        const aniList = [];

        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            const provider = result.provider;
            const data = result.data;

            let media:any = data.media;
            let canPush = true;
            let index = -1;

            for (let j = 0; j < aniList.length; j++) {
                if (aniList[j].id === media.id) {
                    canPush = false;
                    media = aniList[j];
                    index = j;
                }
            }
            if (canPush) {
                aniList.push({
                    id: media.id,
                    anilist: media,
                    connectors: [{ provider: provider, data: result.data.result, comparison: result.data.comparison }]
                });
            } else {
                const aniListData = media.anilist;
                const formatted = {
                    id: media.id,
                    anilist: aniListData,
                    connectors: [...aniList[index].connectors, { provider: provider, data: result.data.result, comparison: result.data.comparison }]
                }
                aniList[index] = formatted;
            }
        }

        return aniList;
    }

    private checkItem(result1:Mapping, result2:Mapping, threshold:number):number {
        let amount = 0;
        let tries = 0;

        result1.title = result1.title != undefined ? result1.title.toLowerCase() : undefined;
        result1.romaji = result1.romaji != undefined ? result1.romaji.toLowerCase() : undefined;
        result1.native = result1.native != undefined ? result1.native.toLowerCase() : undefined;

        result2.title = result2.title != undefined ? result2.title.toLowerCase() : undefined;
        result2.romaji = result2.romaji != undefined ? result2.romaji.toLowerCase() : undefined;
        result2.native = result2.native != undefined ? result2.native.toLowerCase() : undefined;

        // Check title
        if (result1.title != undefined && result2.title != undefined) {
            tries++;
            const stringComparison = this.stringSim.compareTwoStrings(result1.title, result2.title);
            if (result1.title === result2.title || stringComparison > threshold) {
                amount++;
            }
        }

        if (result1.romaji != undefined && result2.romaji != undefined) {
            tries++;
            const stringComparison = this.stringSim.compareTwoStrings(result1.romaji, result2.romaji);
            if (result1.romaji === result2.romaji || stringComparison > threshold) {
                amount++;
            }
        }

        if (result1.native != undefined && result2.native != undefined) {
            tries++;
            const stringComparison = this.stringSim.compareTwoStrings(result1.native, result2.native);
            if (result1.native === result2.native || stringComparison > threshold) {
                amount++;
            }
        }
        return amount / tries;
    }

    private compareAnime(anime:SearchResponse, aniList:[Media]|Media[], threshold:number, comparison_threshold:number):ComparisonData {
        threshold = threshold ? threshold : config.mapping.threshold;
        comparison_threshold = comparison_threshold ? comparison_threshold : config.mapping.comparison_threshold;
        
        const result:ComparisonData[] = [];
        for (let i = 0; i < aniList.length; i++) {
            const media:Media = aniList[i];

            if (!media) {
                continue;
            }

            const map1:Mapping = {
                title: anime.title,
                romaji: anime.romaji,
                native: anime.native
            };
            const map2:Mapping = {
                title: media.title.english,
                romaji: media.title.romaji,
                native: media.title.native
            }

            const comparison = this.checkItem(map1, map2, threshold);
            if (comparison > comparison_threshold) {
                result.push({
                    result: anime,
                    media,
                    comparison
                })
            }
        }
        // It is possible that there are multiple results, so we need to sort them. But generally, there should only be one result.
        return result[0];
    }
}

interface Search {
    provider: string;
    data: ComparisonData;
}

interface Result {
    id: number;
    anilist: Media;
    connectors: [
        {
            provider: string;
            data: SearchResponse;
            comparison: number;
        }
    ];
}

interface ComparisonData {
    result: SearchResponse;
    media: Media;
    comparison: number;
}

interface AggregatorData {
    provider_name: string;
    results: SearchResponse[]
}

interface Mapping {
    title?: string;
    romaji?: string;
    native?: string;
    genres?: string[];
}

export type { Result };