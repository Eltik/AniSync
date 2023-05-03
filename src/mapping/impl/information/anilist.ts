import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { Anime, Format, Genres, Manga, MediaStatus, Season, Type } from "../..";
import InformationProvider, { AnimeInfo, MangaInfo } from ".";
import { wait } from "@/src/helper";
import { existsSync } from "fs";
import { join } from "path";
import { readFile, writeFile } from "fs/promises";
import colors from "colors";

export default class AniList extends InformationProvider {
    override id: string = "anilist";
    override url: string = "https://anilist.co";

    private api: string = "https://graphql.anilist.co";

    override get priorityArea(): (keyof AnimeInfo | MangaInfo)[] {
        return ["bannerImage"];
    }

    override get sharedArea(): (keyof AnimeInfo | MangaInfo)[] {
        return ["synonyms", "genres", "tags"];
    }

    override async search(query: string, type:Type, formats: Format[], page?:number, perPage?:number): Promise<AnimeInfo[] | MangaInfo[] | undefined> {
        // First try manami-project
        const possible = await this.fetchManamiProject(query, type, formats);
        if (possible.length > 0 && type === Type.ANIME) {
            const data = possible.map((media:any) => {
                const sources = media.sources;
                const aniList = sources.find((source:any) => {
                    // Try and parse AniList link
                    const url = new URL(source);
                    if (url.href.includes(this.url)) {
                        return true;
                    }
                });
                const mal = sources.find((source:any) => {
                    // Try and parse AniList link
                    const url = new URL(source);
                    if (url.href.includes("https://myanimelist.net")) {
                        return true;
                    }
                });

                if (!aniList) {
                    return null;
                }

                return {
                    aniListId: aniList ? aniList.split("/anime/")[1] : null,
                    malId: mal ? mal.split("/anime/")[1] : null,
                    title: {
                        english: media.title,
                        romaji: null,
                        native: null
                    },
                    trailer: null,
                    currentEpisode: (media.status === MediaStatus.FINISHED || media.status === MediaStatus.CANCELLED) ? (media.episodes ?? 0) : 0,
                    duration: null,
                    coverImage: media.picture ?? null,
                    bannerImage: null,
                    popularity: 0,
                    synonyms: media.synonyms ?? [],
                    totalEpisodes: media.episodes ?? 0,
                    color: null,
                    status: media.status,
                    season: media.animeSeason.season as Season,
                    genres: [],
                    rating: null,
                    description: null,
                    format: media.type,
                    year: media.animeSeason.year ?? null,
                    type: type,
                    countryOfOrigin: null,
                    tags: media.tags
                }
            })

            if (data.filter((media:any) => media !== null).length > 0) {
                return data.filter((media:any) => media !== null);
            }
        }
        
        const aniListArgs = {
            query: `
            query($page: Int, $perPage: Int, $search: String, $type: MediaType, $format: [MediaFormat]) {
                Page(page: $page, perPage: $perPage) {
                    pageInfo {
                        total
                        currentPage
                        lastPage
                        hasNextPage
                        perPage
                    }
                    media(type: $type, format_in: $format, search: $search) {
                        ${this.query}
                    }
                }
            }
            `,
            variables: {
                search: query,
                type: type,
                format: formats,
                page: page ? page : 0,
                perPage: perPage ? perPage : 15
            }
        }
        const req = await this.request(this.api, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            data: aniListArgs
        });
        if (!req) {
            return undefined;
        }
        const media = req?.data.data.Page.media;
        
        if (type === Type.ANIME) {
            return media.map((data: Media) => {
                return {
                    aniListId: data.id,
                    malId: data.idMal,
                    title: {
                        english: data.title.english ?? null,
                        romaji: data.title.romaji ?? null,
                        native: data.title.native ?? null
                    },
                    trailer: null,
                    currentEpisode: (data.status === MediaStatus.FINISHED || data.status === MediaStatus.CANCELLED) ? (data.episodes ?? 0) : 0,
                    duration: data.duration ?? null,
                    coverImage: data.coverImage.extraLarge ?? null,
                    bannerImage: data.bannerImage ?? null,
                    popularity: Number(data.popularity),
                    synonyms: data.synonyms ?? [],
                    totalEpisodes: data.episodes ?? 0,
                    color: null,
                    status: data.status,
                    season: data.season as Season,
                    genres: data.genres as Genres[] ?? [],
                    rating: data.meanScore ? data.meanScore / 10 : null,
                    description: data.description ?? null,
                    format: data.format,
                    year: data.seasonYear ?? null,
                    // @ts-ignore
                    type: data.type,
                    countryOfOrigin: data.countryOfOrigin ?? null,
                    tags: data.tags
                }
            });
        } else {
            return media.map((data: Media) => {
                return {
                    aniListId: data.id,
                    malId: data.idMal,
                    title: {
                        english: data.title.english ?? null,
                        romaji: data.title.romaji ?? null,
                        native: data.title.native ?? null
                    },
                    coverImage: data.coverImage.extraLarge ?? null,
                    bannerImage: data.bannerImage ?? null,
                    popularity: Number(data.popularity),
                    synonyms: data.synonyms ?? [],
                    totalChapters: data.chapters ?? 0,
                    totalVolumes: data.volumes ?? 0,
                    color: null,
                    status: data.status,
                    genres: data.genres as Genres[] ?? [],
                    rating: data.meanScore ? data.meanScore / 10 : null,
                    description: data.description ?? null,
                    format: data.format,
                    // @ts-ignore
                    type: data.type,
                    countryOfOrigin: data.countryOfOrigin ?? null,
                    tags: data.tags.map((tag) => tag.name)
                }
            });
        }
    }

    override async info(media: Anime | Manga): Promise<AnimeInfo | MangaInfo | undefined> {
        const anilistId = media.id;

        const query = `query ($id: Int) {
            Media (id: $id) {
                ${this.query}
            }
        }`;
        const variables = {
            id: anilistId
        };

        const req = await this.request(this.api, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            data: {
                query,
                variables
            }
        });
        if (!req) {
            return undefined;
        }
        const data: Media = req.data.data.Media;
        
        return {
            title: {
                english: data.title.english ?? null,
                romaji: data.title.romaji ?? null,
                native: data.title.native ?? null
            },
            trailer: null,
            currentEpisode: (data.status === MediaStatus.FINISHED || data.status === MediaStatus.CANCELLED) ? (data.episodes ?? 0) : 0,
            duration: data.duration ?? null,
            coverImage: data.coverImage.extraLarge ?? null,
            bannerImage: data.bannerImage ?? null,
            popularity: Number(data.popularity),
            synonyms: data.synonyms ?? [],
            totalEpisodes: data.episodes ?? 0,
            totalChapters: data.chapters ?? 0,
            totalVolumes: data.volumes ?? 0,
            color: null,
            status: data.status as MediaStatus,
            season: data.season as Season,
            genres: data.genres as Genres[] ?? [],
            rating: data.meanScore ? data.meanScore / 10 : null,
            description: data.description ?? null,
            format: data.format,
            year: data.seasonYear ?? null,
            countryOfOrigin: data.countryOfOrigin ?? null,
            tags: data.tags.map((tag) => tag.name)
        }
    }

    public async getMedia(id: string): Promise<AnimeInfo | MangaInfo | undefined> {
        const query = `query ($id: Int) {
            Media (id: $id) {
                ${this.query}
            }
        }`;
        const variables = {
            id: id
        };

        const req = await this.request(this.api, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            data: {
                query,
                variables
            }
        });
        if (!req) {
            return undefined;
        }
        const data: Media = req.data.data.Media;
        
        return {
            title: {
                english: data.title.english ?? null,
                romaji: data.title.romaji ?? null,
                native: data.title.native ?? null
            },
            trailer: null,
            currentEpisode: (data.status === MediaStatus.FINISHED || data.status === MediaStatus.CANCELLED) ? (data.episodes ?? 0) : 0,
            duration: data.duration ?? null,
            coverImage: data.coverImage.extraLarge ?? null,
            bannerImage: data.bannerImage ?? null,
            popularity: Number(data.popularity),
            synonyms: data.synonyms ?? [],
            totalEpisodes: data.episodes ?? 0,
            color: null,
            status: data.status as MediaStatus,
            season: data.season as Season,
            genres: data.genres as Genres[] ?? [],
            rating: data.meanScore ? data.meanScore / 10 : null,
            description: data.description ?? null,
            format: data.format,
            year: data.seasonYear ?? null,
            // @ts-ignore
            type: data.type,
            countryOfOrigin: data.countryOfOrigin ?? null,
            tags: data.tags.map((tag) => tag.name)
        }
    }

    public async fetchSeasonal(type:Type, formats:Format[]) {
        const aniListArgs = {
            query: `
            query($season: MediaSeason, $seasonYear: Int, $format: [MediaFormat], $page: Int, $perPage: Int, $type: MediaType) {
                trending: Page(page: $page, perPage: $perPage) {
                    media(sort: TRENDING_DESC, type: $type, isAdult: false, format_in: $format) {
                        ...media
                    }
                }
                season: Page(page: $page, perPage: $perPage) {
                    media(season: $season, seasonYear: $seasonYear, sort: POPULARITY_DESC, type: $type, isAdult: false, format_in: $format) {
                        ...media
                    }
                }
                popular: Page(page: $page, perPage: $perPage) {
                    media(sort: POPULARITY_DESC, type: $type, isAdult: false, format_in: $format) {
                        ...media
                    }
                }
                top: Page(page: $page, perPage: $perPage) {
                    media(sort: SCORE_DESC, type: $type, isAdult: false, format_in: $format) {
                        ...media
                    }
                }
            }
            
            fragment media on Media {
                ${this.query}
            }
            `,
            variables: {
                type: type,
                season: Season.SPRING,
                seasonYear: 2023,
                format: formats,
                page: 0,
                perPage: 20
            }
        }

        const req = await this.request(this.api, {
            data: JSON.stringify(aniListArgs),
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            }
        });
        
        const data = req?.data.data;
        if (!data) {
            return undefined;
        }

        const trending = data.trending.media.map((data: Media) => {
            return {
                aniListId: data.id,
                malId: data.idMal,
                title: {
                    english: data.title.english ?? null,
                    romaji: data.title.romaji ?? null,
                    native: data.title.native ?? null
                },
                coverImage: data.coverImage.extraLarge ?? null,
                bannerImage: data.bannerImage ?? null,
                popularity: Number(data.popularity),
                synonyms: data.synonyms ?? [],
                totalChapters: data.chapters ?? 0,
                totalVolumes: data.volumes ?? 0,
                color: null,
                status: data.status,
                genres: data.genres as Genres[] ?? [],
                rating: data.meanScore ? data.meanScore / 10 : null,
                description: data.description ?? null,
                format: data.format,
                countryOfOrigin: data.countryOfOrigin ?? null,
                // @ts-ignore
                type: data.type,
                tags: data.tags.map((tag) => tag.name)
            }
        });

        const seasonal = data.season.media.map((data: Media) => {
            return {
                aniListId: data.id,
                malId: data.idMal,
                title: {
                    english: data.title.english ?? null,
                    romaji: data.title.romaji ?? null,
                    native: data.title.native ?? null
                },
                coverImage: data.coverImage.extraLarge ?? null,
                bannerImage: data.bannerImage ?? null,
                popularity: Number(data.popularity),
                synonyms: data.synonyms ?? [],
                totalChapters: data.chapters ?? 0,
                totalVolumes: data.volumes ?? 0,
                color: null,
                status: data.status,
                genres: data.genres as Genres[] ?? [],
                rating: data.meanScore ? data.meanScore / 10 : null,
                description: data.description ?? null,
                format: data.format,
                countryOfOrigin: data.countryOfOrigin ?? null,
                // @ts-ignore
                type: data.type,
                tags: data.tags.map((tag) => tag.name)
            }
        });

        const popular = data.popular.media.map((data: Media) => {
            return {
                aniListId: data.id,
                malId: data.idMal,
                title: {
                    english: data.title.english ?? null,
                    romaji: data.title.romaji ?? null,
                    native: data.title.native ?? null
                },
                coverImage: data.coverImage.extraLarge ?? null,
                bannerImage: data.bannerImage ?? null,
                popularity: Number(data.popularity),
                synonyms: data.synonyms ?? [],
                totalChapters: data.chapters ?? 0,
                totalVolumes: data.volumes ?? 0,
                color: null,
                status: data.status,
                genres: data.genres as Genres[] ?? [],
                rating: data.meanScore ? data.meanScore / 10 : null,
                description: data.description ?? null,
                format: data.format,
                countryOfOrigin: data.countryOfOrigin ?? null,
                // @ts-ignore
                type: data.type,
                tags: data.tags.map((tag) => tag.name)
            }
        });

        const top = data.top.media.map((data: Media) => {
            return {
                aniListId: data.id,
                malId: data.idMal,
                title: {
                    english: data.title.english ?? null,
                    romaji: data.title.romaji ?? null,
                    native: data.title.native ?? null
                },
                coverImage: data.coverImage.extraLarge ?? null,
                bannerImage: data.bannerImage ?? null,
                popularity: Number(data.popularity),
                synonyms: data.synonyms ?? [],
                totalChapters: data.chapters ?? 0,
                totalVolumes: data.volumes ?? 0,
                color: null,
                status: data.status,
                genres: data.genres as Genres[] ?? [],
                rating: data.meanScore ? data.meanScore / 10 : null,
                description: data.description ?? null,
                format: data.format,
                countryOfOrigin: data.countryOfOrigin ?? null,
                // @ts-ignore
                type: data.type,
                tags: data.tags.map((tag) => tag.name)
            }
        });

        return {
            trending,
            seasonal,
            popular,
            top
        }
    }

    private async fetchManamiProject(query:string, type:Type, formats:Format[]) {
        try {
            if (existsSync(join(__dirname, "./manami.json"))) {
                const data = JSON.parse(await readFile(join(__dirname, "./manami.json"), "utf-8"));
                if (Date.now() - data.time > 86400000) { // 1 day
                    const { data } = await axios.get("https://raw.githubusercontent.com/manami-project/anime-offline-database/master/anime-offline-database.json").then((res) => res.data);
                    data.time = Date.now();
                    await writeFile(join(__dirname, "./manami.json"), JSON.stringify(data, null, 2), "utf-8");
                    console.log(colors.yellow("Manami Project data has been cached."));
                }
                const results = data.filter((data:any) => {
                    return data.title.toLowerCase().includes(query.toLowerCase()) || data.synonyms.some((synonym:string) => synonym.toLowerCase() === query.toLowerCase()) && formats.includes(data.type);
                });
    
                return results;
            } else {
                const { data } = await axios.get("https://raw.githubusercontent.com/manami-project/anime-offline-database/master/anime-offline-database.json").then((res) => res.data);
                data.time = Date.now();
                await writeFile(join(__dirname, "./manami.json"), JSON.stringify(data, null, 2), "utf-8");
                console.log(colors.yellow("Manami Project data has been cached."));
                const results = data.filter((data:any) => {
                    return data.title.toLowerCase().includes(query.toLowerCase()) || data.synonyms.some((synonym:string) => synonym.toLowerCase() === query.toLowerCase()) && formats.includes(data.type);
                });
    
                return results;
            }
        } catch (e) {
            console.error(e);
            return [];
        }
    }

    /**
     * @description Custom request function for handling AniList rate limit.
     */
    public async request(url: string, options?: AxiosRequestConfig, retries: number = 0): Promise<AxiosResponse | null> {
        const req:any = await axios(url, options).catch((err) => {
            return err;
        });

        const response = req.response ? req.response : req;

        const remainingRequests = parseInt(response?.headers['x-ratelimit-remaining']) || 0;
        const requestLimit = parseInt(response?.headers['x-ratelimit-limit']) || 0;
        const resetTime = parseInt(response?.headers['x-ratelimit-reset']) || 0;
        
        if (remainingRequests >= 60) {
            const delay = resetTime * 1000 - Date.now();
            if (delay > 0) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
            return await axios(url, options).catch((err) => {
                const response = err.response;
                if (!response || response.status === 429) {
                    if (retries < 15) {
                        //console.log(colors.yellow("No rate limit headers found. Waiting..."));
                        return this.request(url, options, retries + 1);
                    } else {
                        throw new Error("Rate limit reached.");
                    }
                } else {
                    throw new Error(err);
                }
            });
        }
        if (response.headers['retry-after']) {
            //console.log(colors.yellow("Rate limit headers found. Waiting..."));
            const delay = parseInt(response.headers['retry-after']) * 3000;
            if (delay > 0) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
            return await axios(url, options).catch((err) => {
                const response = err.response;
                if (!response || response.status === 429) {
                    if (retries < 15) {
                        //console.log(colors.yellow("No rate limit headers found. Waiting..."));
                        return this.request(url, options, retries + 1);
                    } else {
                        throw new Error("Rate limit reached.");
                    }
                } else {
                    throw new Error(err);
                }
            });
        }
        if (response.status === 429) {
            if (retries < 15) {
                //console.log(colors.yellow("No rate limit headers found. Waiting..."));
                await wait(1500);
                return this.request(url, options, retries + 1);
            } else {
                return null;
            }
        }
        return response;
    }  

    private query:string = `
    id
    idMal
    title {
        romaji
        english
        native
        userPreferred
    }
    coverImage {
        extraLarge
        large
    }
    bannerImage
    startDate {
        year
        month
        day
    }
    endDate {
        year
        month
        day
    }
    description
    season
    seasonYear
    type
    format
    status(version: 2)
    episodes
    duration
    chapters
    volumes
    genres
    synonyms
    source(version: 3)
    isAdult
    meanScore
    averageScore
    popularity
    favourites
    countryOfOrigin
    isLicensed
    airingSchedule {
        edges {
            node {
                airingAt
                timeUntilAiring
                episode
            }
        }
    }
    relations {
        edges {
            id
            relationType(version: 2)
            node {
                id
                title {
                    userPreferred
                }
                format
                type
                status(version: 2)
                bannerImage
                coverImage {
                    large
                }
            }
        }
    }
    characterPreview: characters(perPage: 6, sort: [ROLE, RELEVANCE, ID]) {
        edges {
            id
            role
            name
            voiceActors(language: JAPANESE, sort: [RELEVANCE, ID]) {
                id
                name {
                    userPreferred
                }
                language: languageV2
                image {
                    large
                }
            }
            node {
                id
                name {
                    userPreferred
                }
                image {
                    large
                }
            }
        }
    }
    studios {
        edges {
            isMain
            node {
                id
                name
            }
        }
    }
    streamingEpisodes {
        title
        thumbnail
        url
    }
    trailer {
        id
        site
    }
    tags {
        id
        name
    }
    `;
}

interface Media {
    id:number;
    idMal:number;
    title: {
        english?: string;
        romaji: string;
        native: string;
        userPreferred: string;
    };
    coverImage: {
        extraLarge:string;
        large:string;
    };
    bannerImage:string;
    startDate: {
        year:number;
        month:number;
        day:number;
    };
    endDate: {
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
    episodes?:number;
    duration?:number;
    chapters?:number;
    volumes?:number;
    genres:string[];
    synonyms:string[]
    source:"ORIGINAL"|"LIGHT_NOVEL"|"VISUAL_NOVEL"|"VIDEO_GAME"|"OTHER"|"NOVEL"|"MANGA"|"DOUJINSHI"|"ANIME"|"WEB_MANGA"|"BOOK"|"CARD_GAME"|"COMIC"|"GAME"|"MUSIC"|"NOVEL"|"ONE_SHOT"|"OTHER"|"PICTURE_BOOK"|"RADIO"|"TV"|"UNKNOWN";
    isAdult:boolean;
    meanScore:number;
    averageScore:number;
    popularity:number;
    favourites:number;
    countryOfOrigin:string;
    isLicensed:boolean;
    airingSchedule: {
        edges: {
            node: {
                airingAt?:any;
                timeUntilAiring?:any
                episode?:any;
            }
        }
    }
    relations: {
        edges: [RelationsNode]
    };
    characterPreview: {
        edges: {
            id:number;
            role:string;
            name?:string;
            voiceActors: {
                id:number;
                name: {
                    userPreferred:string;
                };
                language:string;
                image: {
                    large:string;
                };
            };
            node: {
                id:number;
                name: {
                    userPreferred:string;
                };
                image: {
                    large:string;
                };
            };
        };
    };
    studios: {
        edges: {
            isMain:boolean;
            node: {
                id:number;
                name:string;
            };
        };
    };
    streamingEpisodes: [{
        title?:string;
        thumbnail?:string;
        url?:string;
    }];
    trailer: {
        id:string;
        site:string;
    };
    tags: [{ id:number; name:string; }];
};

interface RelationsNode {
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
}