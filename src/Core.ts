import API, { ProviderType } from "./types/API";
import AniList, { Type, Media, Format } from "./meta/AniList";
import { compareTwoStrings } from "./libraries/StringSimilarity";
import GogoAnime from "./anime/GogoAnime";
import Enime from "./anime/Enime";
import AnimePahe from "./anime/AnimePahe";
import Zoro from "./anime/Zoro";
import ComicK from "./manga/ComicK";
import MangaDex from "./manga/MangaDex";
import MangaPark from "./manga/MangaPark";
import MangaSee from "./manga/MangaSee";
import DB from "./db/DB";
import colors from "colors";
import AnimeThemes from "./meta/AnimeThemes";
import TMDB from "./meta/TMDB";
import KitsuAnime from "./meta/KitsuAnime";
import KitsuManga from "./meta/KitsuManga";
import dotenv from "dotenv";
import Chiaki from "./meta/Chiaki";
import NineAnime from "./anime/9anime";
import { Worker } from "node:worker_threads";
import { join } from "node:path";
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import NovelUpdates from "./novels/NovelUpdates";
import JNovels from "./novels/JNovels";
import MangaReader from "./manga/MangaReader";

export default class Core extends API {
    public aniList = new AniList();

    private db = new DB();

    public classDictionary:Provider[] = [];

    constructor(options?:Options) {
        super(ProviderType.NONE, options);
        this.loadConfig(options);
        if (this.config.is_sqlite) {
            this.db = new DB(this.config.is_sqlite);
        }

        dotenv.config();

        // Class dictionary of all providers. Used for looping through and searching.
        this.classDictionary = [
            {
                name: "9anime",
                object: new NineAnime(),
            },
            {
                name: "Zoro",
                object: new Zoro(),
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
                name: "MangaPark",
                object: new MangaPark(),
            },
            {
                name: "MangaSee",
                object: new MangaSee(),
            },
            {
                name: "MangaReader",
                object: new MangaReader(),
            },
            {
                name: "AnimeThemes",
                object: new AnimeThemes(),
            },
            {
                name: "TMDB",
                object: new TMDB(),
            },
            {
                name: "KitsuAnime",
                object: new KitsuAnime(),
            },
            {
                name: "KitsuManga",
                object: new KitsuManga(),
            },
            {
                name: "Chiaki",
                object: new Chiaki(),
            },
            {
                name: "NovelUpdates",
                object: new NovelUpdates()
            },
            {
                name: "JNovels",
                object: new JNovels()
            }
        ]
    }

    /**
     * @description Initializes the database and proxy list
     */
    public async init(initDB: boolean = true) {
        if (initDB) {
            await this.db.init();
        }
    }

    /**
     * @description Searches using custom mappings. If results don't exist, then they will be fetched and inserted.
     * @param query Media to search for.
     * @param type Type of media to search for.
     * @returns Promise<FormattedResponse[]>
     */
    public async search(query:string, type:Type, format?:Format[]): Promise<FormattedResponse[]> {
        const possible = await this.db.search(query, type, format);
        if (!possible || possible.length === 0) {
            const worker = new Worker(join(__dirname, "../built/workers/searchWorker.js"), {});
            console.log(colors.gray("Created worker ") + colors.blue(String(worker.threadId)));

            worker.on('message', async(data) => {
                if (data.bot) {
                    // Ignore
                } else {
                    if (!data.request) {
                        console.log(colors.gray("Received worker response. Finished."));
                        worker.terminate();
                    } else {
                        // Bottleneck
                        this.aniList.request(data.request.url, data.request.options).then((data) => {
                            const res = data.raw();
                            worker.postMessage({
                                response: {
                                    status: res.status,
                                    statusText: res.statusText,
                                    headers: res.headers,
                                    data: res.data,
                                    request: data.request
                                }
                            });
                        }).catch(async(err) => {
                            console.log(colors.red("There was an error searching AniList!"))
                        });
                    }
                }
            });

            worker.on('error', async(err: Error) => {
                console.log(err);
            });

            worker.on('exit', async(code: number) => {
                if (code != 1) {
                    console.log(colors.red(`Worker exited with code ${code}`))
                }
            });

            worker.postMessage({
                options: this.config,
                type: type,
                format: format,
                query: query,
            });
            return [];
        } else {
            return possible;
        }
    }

    /**
     * @description Searches on AniList and on providers and finds the best results possible. Very accurate but a lot slower.
     * @param query Media to search for.
     * @param type Type of media to search for.
     * @returns Promise<FormattedResponse[]>
     */
    public async searchAccurate(query:string, type:Type, format?:Format[]): Promise<FormattedResponse[]> {
        const result: FormattedResponse[] = [];
        if (this.config.debug) {
            console.log(colors.yellow("No results found in database. Searching providers..."));
            console.log(colors.gray("Searching for ") + colors.blue(query) + colors.gray(" of type ") + colors.blue(type) + colors.gray(" and of formats ") + (colors.blue(format?.toString()))) + colors.gray("...");
        }
        // Search on AniList first
        const aniSearch = await this.aniSearch(query, type, format);
        if (this.config.debug) {
            console.log(colors.green("Received ") + colors.blue("AniList") + colors.green(" response."));
        }

        const aniList = this.searchCompare(result, aniSearch);
        // Then search on providers
        const pageSearch = await this.pageSearch(query, type, format);
        if (this.config.debug) {
            console.log(colors.green("Received ") + colors.blue("Provider") + colors.green(" response."));
        }
        // Find the best results possible
        const pageList = this.searchCompare(aniList, pageSearch, 0.5);
        await this.db.insert(pageList, type);

        return pageList;
    }

    /**
     * @description Searches for media on AniList and maps the results to providers.
     * @param query Media to search for.
     * @param type Type of media to search for.
     * @returns Promise<FormattedResponse[]>
     */
    private async aniSearch(query:string, type:Type, format?:Format[]): Promise<FormattedResponse[]> {
        const results:SearchResponse[] = [];

        const aniList = format ? await this.aniList.searchFormat(query, type, format) : await this.aniList.search(query, type);

        const promises = [];
        for (let i = 0; i < this.classDictionary.length; i++) {
            const provider:any = this.classDictionary[i];
            if (provider.object.providerType === type) {
                // Check format
                if (format && provider.object.formats) {
                    let canSearch = true;
                    for (let j = 0; j < format.length; j++) {
                        if (!provider.object.formats.includes(format[j])) {
                            canSearch = false;
                            break;
                        }
                    }
                    if (!canSearch) {
                        continue;
                    }
                }
                const promise = new Promise((resolve, reject) => {
                    provider.object.search(query).then(async(data) => {
                        
                        // Sometimes providers doesn't take certain queries. This is a workaround.
                        const aniList = format ? await this.aniList.searchFormat(query, type, format) : await this.aniList.search(query, type);

                        const firstResult = aniList[0];
                        if (data.length === 0 && firstResult.title.english) {
                            data = await provider.object.search(firstResult.title.english);
                            await this.wait(provider.object.rateLimit);
                        }
                        if (data.length === 0 && firstResult.title.romaji) {
                            data = await provider.object.search(firstResult.title.romaji);
                            await this.wait(provider.object.rateLimit);
                        }
                        if (data.length === 0 && firstResult.title.native) {
                            data = await provider.object.search(firstResult.title.native);
                            await this.wait(provider.object.rateLimit);
                        }
                        if (data.length === 0 && firstResult.synonyms?.length > 0) {
                            for (let i = 0; i < firstResult.synonyms.length; i++) {
                                data = await provider.object.search(firstResult.synonyms[i]);
                                if (data.length > 0) {
                                    break;
                                }
                                await this.wait(provider.object.rateLimit);
                            }
                        }

                        data.provider = provider.object.name;
                        resolve(data);
                    }).catch(async(err) => {
                        if (this.config.debug) {
                            console.log(colors.red("Error fetching from provider " + provider.name + ": " + err.message));
                        }
                        resolve([]);
                    });
                });
                promises.push(promise);
            }
        }

        const resultsArray = await Promise.all(promises);

        for (let i = 0; i < resultsArray.length; i++) {
            for (let j = 0; j < resultsArray[i].length; j++) {
                let best: any = null;
    
                aniList.map(async (result: Media) => {
                    if (type === Type.MANGA && (format ? format.includes(Format.NOVEL) : true)) {
                        if (result.format === Format.NOVEL) {
                            return;
                        }
                    }

                    if (result.status === "NOT_YET_RELEASED") {
                        return;
                    }

                    const title = result.title.userPreferred || result.title.romaji || result.title.english || result.title.native;
                    const altTitles:any[] = Object.values(result.title).concat(result.synonyms);
                    const aniList:Media = result;
    
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
                    retEl.provider = resultsArray[i].provider;
                    results.push({
                        id: retEl.url,
                        data: best.aniList,
                        similarity: best.similarity,
                        connector: retEl,
                    });
                }
            }
        }
        return this.formatSearch(results);
    }

    /**
     * @description Searches for media on all providers and maps the results to AniList.
     * @param query Media to search for.
     * @param type Type of media to search for.
     * @returns Promise<FormattedResponse[]>
     */
    private async pageSearch(query:string, type:Type, format?:Format[]): Promise<FormattedResponse[]> {
        const results:SearchResponse[] = [];

        const promises = [];
        for (let i = 0; i < this.classDictionary.length; i++) {
            const provider = this.classDictionary[i];
            if (provider.object.providerType === type) {
                // Check format
                if (format && provider.object.formats) {
                    let canSearch = true;
                    for (let j = 0; j < format.length; j++) {
                        if (!provider.object.formats.includes(format[j])) {
                            canSearch = false;
                            break;
                        }
                    }
                    if (!canSearch) {
                        continue;
                    }
                }
                const promise = new Promise((resolve, reject) => {
                    provider.object.search(query).then(async(data) => {

                        // Sometimes providers doesn't take certain queries. This is a workaround.
                        const aniList = format ? await this.aniList.searchFormat(query, type, format) : await this.aniList.search(query, type);

                        const firstResult = aniList[0];
                        if (data.length === 0 && firstResult.title.english) {
                            data = await provider.object.search(firstResult.title.english);
                            await this.wait(provider.object.rateLimit);
                        }
                        if (data.length === 0 && firstResult.title.romaji) {
                            data = await provider.object.search(firstResult.title.romaji);
                            await this.wait(provider.object.rateLimit);
                        }
                        if (data.length === 0 && firstResult.title.native) {
                            data = await provider.object.search(firstResult.title.native);
                            await this.wait(provider.object.rateLimit);
                        }
                        if (data.length === 0 && firstResult.synonyms?.length > 0) {
                            for (let i = 0; i < firstResult.synonyms.length; i++) {
                                data = await provider.object.search(firstResult.synonyms[i]);
                                if (data.length > 0) {
                                    break;
                                }
                                await this.wait(provider.object.rateLimit);
                            }
                        }

                        data.provider = provider.object.name;
                        resolve(data);
                    }).catch(async(err) => {
                        if (this.config.debug) {
                            console.log(colors.red("Error fetching from provider " + provider.name + ": " + err.message));
                        }
                        resolve([]);
                    });
                });
                promises.push(promise);
            }
        }
        const resultsArray = await Promise.all(promises);

        if (this.config.debug) {
            console.log(colors.gray("Received ") + colors.blue(String(resultsArray.length) + " results") + colors.gray(" from providers."));
        }
        
        for (let i = 0; i < resultsArray.length; i++) {
            for (let j = 0; j < resultsArray[i].length; j++) {
                const aniSearch = format ? await this.aniList.searchFormat(this.sanitizeTitle(resultsArray[i][j].title), type, format) : await this.aniList.search(this.sanitizeTitle(resultsArray[i][j].title), type);
            
                let best: any = null;

                aniSearch.map(async (result: Media) => {
                    if (result.status === "NOT_YET_RELEASED") {
                        return;
                    }

                    const title = result.title.userPreferred || result.title.romaji || result.title.english || result.title.native;
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
                        connector: retEl
                    });
                }
            }
        }

        let data = this.formatSearch(results);
        return data;
    }

    /**
     * 
     * @param id AniList ID of the media to get
     * @param useSearchAccurate If true, will use searchAccurate to get the media. If false, will use search.
     * @returns 
     */
    public async get(id:string, useSearchAccurate:boolean = false, format?:Format[]): Promise<FormattedResponse> {
        const aniPossible = await this.db.get(id, Type.ANIME, format);
        const mangaPossible = await this.db.get(id, Type.MANGA, format);
        if (!aniPossible && !mangaPossible) {
            const aniList = await this.aniList.getMedia(id);
            if (!aniList) {
                return null;
            }
            let result:FormattedResponse = null;
            if (useSearchAccurate) {
                const results = await this.searchAccurate(aniList.title.userPreferred, aniList.type, format);
                for (let i = 0; i < results.length; i++) {
                    if (Number(results[i].id) === Number(id)) {
                        result = results[i];
                    }
                }
            } else {
                const results = await this.search(aniList.title.userPreferred, aniList.type, format);
                for (let i = 0; i < results.length; i++) {
                    if (Number(results[i].id) === Number(id)) {
                        result = results[i];
                    }
                }
            }
            return result;
        } else {
            if (!aniPossible) {
                return mangaPossible;
            } else {
                return aniPossible;
            }
        }
    }

    /**
     * @description Deletes stored data based on the AniList ID
     * @param id AniList ID of the media to delete
     * @param type Type of media to delete
     */
    public async delete(id:string, type:Type): Promise<void> {
        await this.db.delete(id, type);
    }

    /**
     * @description Fetches stored data based on the MyAnimeList ID
     * @param id MyAnimeList ID of the media to get
     * @returns Promise<FormattedResponse>
     */
    public async getMal(id:string, type:Type): Promise<FormattedResponse> {
        const data = await this.db.getMal(id, type);
        return data;
    }

    /**
     * 
     * @param type Type of media to query
     * @param amount Amount of media to get
     * @param ommitTop Ommits data for top since there will sometimes be new shows that aren't in the database
     * @param ommitNextSeason Ommits data for next season (since there likely won't be any valid results)
     */
    public async getSeasonal(type:Type, amount:number, format?:Format[], ommitTop:boolean = true, ommitNextSeason:boolean = true): Promise<SeasonalResponse> {
        const data = await this.aniList.getSeasonal(type, format, 0, amount);
        const useSearchAccurate = false;

        const results:SeasonalResponse = {
            trending: [],
            season: [],
            nextSeason: [],
            popular: [],
            top: []
        }

        const trending = data.data.trending.media;
        const season = data.data.season.media;
        const nextSeason = data.data.nextSeason.media;
        const popular = data.data.popular.media;
        const top = data.data.top.media;

        for (let i = 0; i < trending.length; i++) {
            const media = trending[i];
            const possible = await this.db.get(String(media.id), type, format);
            if (!possible) {
                const result = await this.get(String(media.id), useSearchAccurate, format);
                this.db.insert([result], type);
                results.trending.push(result);
            } else {
                results.trending.push(possible);
            }
        }
        for (let i = 0; i < season.length; i++) {
            const media = season[i];
            const possible = await this.db.get(String(media.id), type, format);
            if (!possible) {
                const result = await this.get(String(media.id), useSearchAccurate, format);
                this.db.insert([result], type);
                results.season.push(result);
            } else {
                results.season.push(possible);
            }
        }
        if (!ommitNextSeason) {
            for (let i = 0; i < nextSeason.length; i++) {
                const media = nextSeason[i];
                const possible = await this.db.get(String(media.id), type, format);
                if (!possible) {
                    const result = await this.get(String(media.id), useSearchAccurate, format);
                    this.db.insert([result], type);
                    results.nextSeason.push(result);
                } else {
                    results.nextSeason.push(possible);
                }
            }
        }
        for (let i = 0; i < popular.length; i++) {
            const media = popular[i];
            const possible = await this.db.get(String(media.id), type, format);
            if (!possible) {
                const result = await this.get(String(media.id), useSearchAccurate, format);
                this.db.insert([result], type);
                results.popular.push(result);
            } else {
                results.popular.push(possible);
            }
        }
        if (!ommitTop) {
            for (let i = 0; i < top.length; i++) {
                const media = top[i];
                const possible = await this.db.get(String(media.id), type, format);
                if (!possible) {
                    const result = await this.get(String(media.id), useSearchAccurate, format);
                    this.db.insert([result], type);
                    results.top.push(result);
                } else {
                    results.top.push(possible);
                }
            }
        }
        return results;
    }

    /**
     * @description Crawls the provider for media.
     * @param type Type of media to crawl
     * @param maxIds Max IDs to crawl
     * @returns Promise<any>
     */
     public async crawl(type:Type, maxIds?:number): Promise<FormattedResponse[]> {
        const results = [];

        let ids = [];
        if (type === Type.ANIME) {
            ids = await this.aniList.getAnimeIDs();
        } else if (type === Type.MANGA) {
            ids = await this.aniList.getMangaIDs();
        } else {
            throw new Error("Unknown type.");
        }

        maxIds = maxIds ? maxIds : ids.length;

        let lastId = 0;
         
        try {
            let lastIdString = readFileSync("lastId.txt", "utf8");
            lastId = isNaN(parseInt(lastIdString)) ? 0 : parseInt(lastIdString);
        } catch(err) {
            if (!existsSync("lastId.txt")) {
                console.log(colors.yellow("lastId.txt does not exist. Creating..."));
                writeFileSync("lastId.txt", "0");
                console.log(colors.green("Created lastId.txt"));
            } else {
                console.log(colors.red("Could not read lastId.txt"));
            }
        }

        for (let i = lastId; i < ids.length && i < maxIds; i++) {
            if (i >= maxIds) {
                break;
            }
            const possible = await this.db.get(ids[i], type);
            if (!possible) {
                const start = new Date(Date.now());

                const data = await this.aniList.getMedia(ids[i]).catch((err) => {
                    if (this.config.debug) {
                        console.log(colors.red("Error fetching ID: ") + colors.white(ids[i] + ""));
                    }
                    return null;
                });
                if (data) {
                    const result = await this.get(ids[i], true, [(data as Media).format]).catch((err) => {
                        if (this.config.debug) {
                            console.log(colors.red("Error fetching ID from providers: ") + colors.white(ids[i] + ""));
                            console.log(colors.gray(err.message));
                            console.log(err);
                        }
                        return null;
                    });
                    if (result) {
                        results.push(result);
                    }
                }
                if (this.config.debug) {
                    const end = new Date(Date.now());
                    console.log(colors.gray("Finished fetching data. Request(s) took ") + colors.cyan(String(end.getTime() - start.getTime())) + colors.gray(" milliseconds."));
                    console.log(colors.green("Fetched ID ") + colors.blue("#" + (i + 1) + "/" + maxIds));
                }
                
                writeFileSync("lastId.txt", i.toString());
            }
        }

        if (this.config.debug) {
            console.log(colors.green("Crawling finished."));
        }
        return results;
    }

     /**
     * @description Formats search responses so that all connectors are assigned to one AniList media object.
     * @param results Search results
     * @returns FormattedResponse[]
     */
    private formatSearch(results:SearchResponse[]): FormattedResponse[] {
        const formatted:FormattedResponse[] = [];

        for (let i = 0; i < results.length; i++) {
            const item:any = results[i];
            let hasPushed = false;
            for (let j = 0; j < formatted.length; j++) {
                if (formatted[j].id === item.data.id) {
                    hasPushed = true;
                    const toPush = {
                        id: item.id,
                        data: item.connector,
                        img: item.connector.img,
                        similarity: item.similarity
                    }
                    if (!toPush.img) {
                        delete toPush.img;
                    }
                    formatted[j].connectors.push(toPush); 
                }
            }
            if (!hasPushed) {
                item.connectors = [
                    {
                        id: item.id,
                        data: item.connector,
                        img: item.connector.img,
                        similarity: item.similarity
                    }
                ];
                if (!item.connectors[0].img) {
                    delete item.connectors[0].img;
                }
                item.id = item.data.id;

                const temp:FormattedResponse = {
                    id: item.id,
                    averageScore: item.data.averageScore,
                    coverImage: item.data.coverImage,
                    description: item.data.description,
                    bannerImage: item.data.bannerImage,
                    format: item.data.format,
                    genres: item.data.genres,
                    idMal: item.data.idMal,
                    meanScore: item.data.meanScore,
                    relations: item.data.relations,
                    season: item.data.season,
                    seasonYear: item.data.seasonYear,
                    status: item.data.status,
                    source: item.data.source,
                    startDate: item.data.startDate,
                    streamingEpisodes: item.data.streamingEpisodes,
                    synonyms: item.data.synonyms,
                    title: item.data.title,
                    trailer: item.data.trailer,
                    type: item.data.type,
                    connectors: item.connectors,
                };
                formatted.push(temp);
            }
        }

        // Set the AniList image
        for (let i = 0; i < formatted.length; i++) {
            const connectors = formatted[i].connectors;
            let best = -1;
            let bestIndex = 0;
            for (let j = 0; j < connectors.length; j++) {
                if (connectors[j].img && connectors[j].similarity.value > best) {
                    bestIndex = 0;
                    best = connectors[j].similarity.value;
                }
            }
            if (best > -1) {
                formatted[i].coverImage.alt = connectors[bestIndex].img;
            }
        }
        return formatted;
    }

    /**
     * @description Compares the similarity between the external title and the title from the provider.
     * @param externalTitle Title from AniList/MAL
     * @param title Title from provider
     * @param titleArray Alt titles from provider
     * @returns { same: boolean, value: number }
     */
    public similarity(externalTitle, title, titleArray: string[] = []): { same: boolean, value: number } {
        if (!title) {
            title = "";
        }
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

    /**
     * @description Compares two responses and replaces results that have a better response
     * @param curVal Original response
     * @param newVal New response to compare
     * @param threshold Optional minimum threshold required
     * @returns FormattedResponse[]
     */
     private searchCompare(curVal:FormattedResponse[], newVal:FormattedResponse[], threshold = 0):FormattedResponse[] {
        const res:FormattedResponse[] = [];
        if (curVal.length > 0 && newVal.length > 0) {
            for (let i = 0; i < curVal.length; i++) {
                for (let j = 0; j < newVal.length; j++) {
                    if (String(curVal[i].id) === String(newVal[j].id)) {
                        // Can compare now
                        const connectors = [];

                        for (let k = 0; k < curVal[i].connectors.length; k++) {
                            for (let l = 0; l < newVal[j].connectors.length; l++) {
                                if (curVal[i].connectors[k].id === newVal[j].connectors[l].id) {
                                    // Compare similarity
                                    if (newVal[j].connectors[l].similarity.value < threshold || curVal[i].connectors[k].similarity.value >= newVal[j].connectors[l].similarity.value) {
                                        connectors.push(curVal[i].connectors[k]);
                                    } else {
                                        connectors.push(newVal[j].connectors[l]);
                                    }
                                }
                            }
                        }

                        res.push({
                            id: curVal[i].id,
                            bannerImage: curVal[i].bannerImage,
                            coverImage: curVal[i].coverImage,
                            description: curVal[i].description,
                            format: curVal[i].format,
                            genres: curVal[i].genres,
                            idMal: curVal[i].idMal,
                            meanScore: curVal[i].meanScore,
                            relations: curVal[i].relations,
                            season: curVal[i].season,
                            seasonYear: curVal[i].seasonYear,
                            status: curVal[i].status,
                            synonyms: curVal[i].synonyms,
                            source: curVal[i].source,
                            startDate: curVal[i].startDate,
                            streamingEpisodes: curVal[i].streamingEpisodes,
                            title: curVal[i].title,
                            type: curVal[i].type,
                            trailer: curVal[i].trailer,
                            averageScore: curVal[i].averageScore,
                            connectors,
                        });
                    }
                }
            }
            return res;
        }
        if (curVal.length > 0) return curVal;
        return newVal;
    }

    /**
     * @description Gets all media cached
     * @param type Type of media to get
     * @returns Promise<FormattedResponse[]>
     */
    public async getAll(type:Type): Promise<FormattedResponse[]> {
        const data = await this.db.getAll(type);
        return data;
    }

    /**
     * @description Exports the database to a JSON file.
     */
    public async export(): Promise<void> {
        await this.db.export();
    }

    /**
     * @description Imports a JSON file into the database.
     */
    public async import(): Promise<void> {
        await this.db.import();
    }

    /**
     * @description Clears the database.
     */
    public async clearDatabase(): Promise<void> {
        await this.db.clearDatabase();
    }

    /**
     * @description Converts the provider to it's object
     * @param url URL of a provider
     * @returns any
     */
    private fetchProvider(url:string): { provider_name: string, provider: any } {
        let provider = null;
        let providerName = "";

        const uri = new URL(url).hostname.replace('www.','');
        this.classDictionary.map((el, index) => {
            // Get the domain
            const baseURL = new URL(el.object.baseURL).hostname.replace('www.','');
            let apiURL:any = "";
            if (el.object.api) apiURL = new URL(el.object.api).hostname.replace('www.','');

            if (uri === baseURL || uri === apiURL) {
                provider = el.object;
                providerName = el.name;
            }
            for (let i = 0 ; i < el.object.altURLs.length; i++) {
                const alias = new URL(el.object.altURLs[i]).hostname.replace('www.','');
                if (uri === alias) {
                    provider = el.object;
                    providerName = el.name;
                }
            }
        })
        return {
            provider_name: providerName,
            provider: provider
        };
    }
    
    private fetchProviderByName(name:string): { provider_name: string, provider: any } {
        let provider = null;
        let providerName = "";
        this.classDictionary.map((el, index) => {
            if (el.name.toLowerCase() === name.toLowerCase()) {
                provider = el.object;
                providerName = el.name;
            }
        })
        return {
            provider_name: providerName,
            provider: provider
        };
    }

    /**
     * @description Sends a request to an image and returns an array buffer
     * @param url Image URL
     * @param options axios options
     * @returns Array Buffer
     */
    public async getImage(url: string, options: {}): Promise<any> {
        const data = await this.fetch(url, {
            method: "GET",
            responseType: 'arraybuffer',
            ...options,
        });
        return data.raw().data;
    }

    /**
     * @description Logs all invalid media into a file (media with less than 2 connectors)
     * @param type Type of media to log
     */
    public async logInvalid(type:Type) {
        const data = await this.db.getAll(type);
        const invalid = [];
        for (let i = 0; i < data.length; i++) {
            const zoroConnectors = data[i].connectors.filter((el:any) => el.id.includes("https://zoro.to"));
            const nineConnectors = data[i].connectors.filter((el:any) => el.id.includes("https://9anime."));

            if (zoroConnectors.length > 1 || nineConnectors.length > 1 || data[i].connectors.length < 2) {
                invalid.push({
                    id: data[i].id,
                    title: data[i].title,
                    format: data[i].format
                })
            }
        }
        console.log(invalid.length + " invalid media.");
        writeFileSync(join(__dirname, "../invalid.json"), JSON.stringify(invalid, null, 4), "utf-8");
    }

    /**
     * @description Deletes all invalid media from the database
     * @param type Type of media to delete
     * @returns Promise<void>
     */
    public async deleteInvalid(type:Type): Promise<void> {
        if (!existsSync(join(__dirname, "../invalid.json"))) {
            console.log(colors.red("invalid.json file not found."));
            return;
        }
        const res = JSON.parse(readFileSync(join(__dirname, "../invalid.json"), "utf-8"));
        for (let i = 0; i < res.length; i++) {
            await this.db.delete(res[i].id, type);
        }
        console.log(colors.green("Finished!"));
    }

    /**
     * @description Crawls through all invalid media and updates them
     * @param type Type of media to crawl
     * @returns Crwals thorugh invalid IDs
     */
    public async crawlInvalid(type:Type): Promise<void> {
        if (!existsSync(join(__dirname, "../invalid.json"))) {
            console.log(colors.red("invalid.json file not found."));
            return;
        }
        const res = JSON.parse(readFileSync(join(__dirname, "../invalid.json"), "utf-8"));
        for (let i = 0; i < res.length; i++) {
            const data = await this.aniList.getMedia(res[i].id).catch((err) => {
                if (this.config.debug) {
                    console.log(colors.red("Error fetching ID: ") + colors.white(res[i].id + ""));
                }
                return null;
            });
            if (data) {
                const format = res[i].format;
                await this.get(res[i].id, true, [format]).catch((err) => {
                    if (this.config.debug) {
                        console.log(colors.red("Error fetching ID from providers: ") + colors.white(res[i].id + ""));
                        console.log(colors.gray(err.message));
                        console.log(err);
                    }
                    return null;
                })
            } else {
                if (this.config.debug) {
                    console.log(colors.red("Error fetching ID from AniList: ") + colors.white(res[i].id + ""));
                }
            }
            if (this.config.debug) {
                console.log(colors.green("Fetched ID ") + colors.blue("#" + (i + 1) + "/" + res.length));
            }
        }
        console.log(colors.green("Done!"));
    }
}

interface Result {
    title: string;
    img?: string;
    altTitles?: string[];
    url: string;
}

interface Provider {
    name: string;
    object: any;
}

interface FormattedResponse {
    id: string;
    idMal: number;
    title: {
        english?: string;
        romaji?: string;
        native?: string;
        userPreferred?: string;
    };
    coverImage: {
        alt: string; // Connector title
        extraLarge:string;
        large:string;
    };
    bannerImage:string;
    startDate: {
        year:number;
        month:number;
        day:number;
    };
    description:string;
    season:"WINTER"|"SPRING"|"SUMMER"|"FALL";
    seasonYear:number;
    type:Type;
    format:Format;
    status:"FINISHED"|"RELEASING"|"NOT_YET_RELEASED"|"CANCELLED";
    genres:string[];
    synonyms:string[]
    source:"ORIGINAL"|"LIGHT_NOVEL"|"VISUAL_NOVEL"|"VIDEO_GAME"|"OTHER"|"NOVEL"|"MANGA"|"DOUJINSHI"|"ANIME"|"WEB_MANGA"|"BOOK"|"CARD_GAME"|"COMIC"|"GAME"|"MUSIC"|"NOVEL"|"ONE_SHOT"|"OTHER"|"PICTURE_BOOK"|"RADIO"|"TV"|"UNKNOWN";
    meanScore:number;
    averageScore:number;
    relations: {
        edges: [{
            id:number;
            relationType:string;
            node: {
                id:number;
                title: {
                    userPreferred:string;
                };
                format:Format;
                type:Type;
                status:string;
                bannerImage:string;
                coverImage: {
                    large:string;
                }
            };
        }]
    };
    streamingEpisodes: {
        title?:string;
        thumbnail?:string;
        url?:string;
    };
    trailer: {
        id:string;
        site:string;
    };
    connectors: any[];
}

interface SearchResponse {
    id: string; // The provider's URL
    data: Media;
    similarity: {
        same: boolean;
        value: number;
    };
    connector?: Result;
}

interface SeasonalResponse {
    trending: Array<FormattedResponse>;
    season: Array<FormattedResponse>;
    nextSeason: Array<FormattedResponse>;
    popular: Array<FormattedResponse>;
    top: Array<FormattedResponse>;
}

interface Options {
    debug?: boolean,
    web_server?: {
        url?: string,
        main_url?: string,
        cors?: [string],
        port?: number
    },
    AniList?: {
        SEASON?: string,
        SEASON_YEAR?: number,
        NEXT_SEASON?: string,
        NEXT_YEAR?: number,
        oath_id?: number,
        oath_secret?: string
    },
    database_url?: string,
    is_sqlite?: boolean
    is_python3?: boolean,
}

export type { Result, Provider, FormattedResponse, SearchResponse, Options };
