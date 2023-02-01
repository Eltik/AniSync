import API, { ProviderType } from "./API";
import { search, getAnimeIDs, getMangaIDs, Type, Media } from "./meta/AniList";
import { compareTwoStrings } from "./libraries/StringSimilarity";
import AnimeFox from "./anime/AnimeFox";
import GogoAnime from "./anime/GogoAnime";
import Enime from "./anime/Enime";
import AnimePahe from "./anime/AnimePahe";
import Zoro from "./anime/Zoro";
import ComicK from "./manga/ComicK";
import MangaDex from "./manga/MangaDex";
import Mangakakalot from "./manga/Mangakakalot";
import MangaPark from "./manga/MangaPark";
import MangaSee from "./manga/MangaSee";

export default class Sync extends API {
    public classDictionary:Provider[] = [];

    constructor() {
        super(ProviderType.NONE);

        // Class dictionary of all providers. Used for looping through and searching.
        this.classDictionary = [
            {
                name: "Zoro",
                object: new Zoro(),
            },
            {
                name: "AnimeFox",
                object: new AnimeFox(),
            },
            {
                name: "AnimePahe",
                object: new AnimePahe(),
            },
            {
                name: "Enime",
                object: new Enime(),
            },
            {
                name: "GogoAnime",
                object: new GogoAnime(),
            },
            {
                name: "ComicK",
                object: new ComicK(),
            },
            {
                name: "MangaDex",
                object: new MangaDex(),
            },
            {
                name: "Mangakakalot",
                object: new Mangakakalot(),
            },
            {
                name: "MangaPark",
                object: new MangaPark(),
            },
            {
                name: "MangaSee",
                object: new MangaSee(),
            }
        ]
    }

    /**
     * @description Searches for media on all providers and maps the results to AniList.
     * @param query Media to search for.
     * @param type Type of media to search for.
     * @returns Promise<SearchResponse[]>
     */
    public async search(query:string, type:Type): Promise<any[]> {
        const results:SearchResponse[] = [];

        const promises = [];
        for (let i = 0; i < this.classDictionary.length; i++) {
            const provider:any = this.classDictionary[i];
            if (provider.object.providerType === type) {
                promises.push(provider.object.search(query));
            }
        }
        const resultsArray = await Promise.all(promises);
        
        for (let i = 0; i < resultsArray.length; i++) {
            for (let j = 0; j < resultsArray[i].length; j++) {
                const aniSearch = await search(this.sanitizeTitle(resultsArray[i][j].title), type);
            
                let best: any = null;

                aniSearch.map(async (result:any) => {
                    const title = result.title.userPreferred;
                    const altTitles:any[] = Object.values(result.title).concat(result.synonyms);
                    const aniList = result;
    
                    const sim = this.similarity(title, resultsArray[i][j].title, altTitles);
                    const tempBest = {
                        index: j,
                        similarity: sim,
                        aniList: aniList,
                    };
    
                    if (!best || sim.value > best.similarity.value) {
                        best = tempBest;
                    }
                });
                if (best) {
                    const retEl = resultsArray[i][best.index];
                    results.push({
                        id: retEl.url,
                        data: best.aniList,
                        similarity: best.similarity,
                    });
                }
                await this.wait(200); // AniList timeout. Needs to be reworked.
            }
        }
        let data = this.formatSearch(results);
        return data;
    }

    private formatSearch(results:SearchResponse[]) {
        const formatted:FormattedResponse[] = [];

        for (let i = 0; i < results.length; i++) {
            const item:any = results[i];
            let hasPushed = false;
            for (let j = 0; j < formatted.length; j++) {
                if (formatted[j].data.id === item.data.id) {
                    hasPushed = true;
                    formatted[j].connectors.push(
                        {
                            id: item.id,
                            similarity: item.similarity
                        }
                    );
                }
            }
            if (!hasPushed) {
                item.connectors = [item.id];
                item.id = item.data.id;
                const temp = {
                    id: item.id,
                    data: item.data,
                    connectors: item.connectors,
                };
                formatted.push(temp);
            }
        }
        return formatted;
    }

    /**
     * @description Crawls the provider for media.
     * @param type Type of media to crawl
     * @param maxPages Max pages to crawl
     * @returns Promise<any>
     */
    public async crawl(type:Type, maxPages?:number): Promise<any> {
        maxPages = maxPages ? maxPages : 1;

        let ids = [];
        if (type === Type.ANIME) {
            ids = await getAnimeIDs();
        } else if (type === Type.MANGA) {
            ids = await getMangaIDs();
        } else {
            throw new Error("Unknown type.");
        }
        return null;
    }

    /**
     * @description Compares the similarity between the external title and the title from the provider.
     * @param externalTitle Title from AniList/MAL
     * @param title Title from provider
     * @param titleArray Alt titles from provider
     * @returns { same: boolean, value: number }
     */
    public similarity(externalTitle, title, titleArray: string[] = []): { same: boolean, value: number } {
        let simi = compareTwoStrings(this.sanitizeTitle(title.toLowerCase()), externalTitle.toLowerCase());
        titleArray.forEach(el => {
            if (el) {
                const tempSimi = compareTwoStrings(title.toLowerCase(), el.toLowerCase());
                if (tempSimi > simi) simi = tempSimi;
            }
        });
        let found = false;
        if (simi > 0.6) {
            found = true;
        }

        return {
            same: found,
            value: simi,
        };
    }

    /**
     * @description Used for removing unnecessary information from the title.
     * @param title Title to sanitize.
     * @returns string
     */
    public sanitizeTitle(title):string {
        let resTitle = title.replace(
            / *(\(dub\)|\(sub\)|\(uncensored\)|\(uncut\)|\(subbed\)|\(dubbed\))/i,
            '',
        );
        resTitle = resTitle.replace(/ *\([^)]+audio\)/i, '');
        resTitle = resTitle.replace(/ BD( |$)/i, '');
        resTitle = resTitle.replace(/\(TV\)/g, '');
        resTitle = resTitle.trim();
        resTitle = resTitle.substring(0, 99); // truncate
        return resTitle;
    }
}

interface Result {
    title: string;
    altTitles?: string[];
    url: string;
}

interface Provider {
    name: string;
    object: any;
}

interface FormattedResponse {
    id: string;
    data: Media;
    connectors: any[];
}

interface SearchResponse {
    id: string; // The provider's URL
    data: Media;
    similarity: {
        same: boolean;
        value: number;
    };
}

export type { Result, Provider };