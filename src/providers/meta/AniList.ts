import { config } from "../../config";
import API, { ProviderType } from "../../API";

export default class AniList extends API {
    private api:string = "https://graphql.anilist.co";
    public id:string = undefined;
    public type:Type["ANIME"]|Type["MANGA"] = undefined;
    private format:Format = undefined;
    public isMal:boolean = false;
    private config = config.mapping.provider.AniList;

    private query:string = `
    id
    idMal
    title {
        romaji
        english
        native
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

    constructor(id?:string, type?:Type["ANIME"]|Type["MANGA"], format?:Format, isMal?:boolean) {
        super(ProviderType.META);
        this.id = this.parseURL(id);
        this.isMal = isMal;
        this.type = type ? type : "ANIME";
        this.format = format ? format : Format.TV;
    }

    public parseURL(id?:any):string {
        id = id ? id : this.id;
        if (!id) {
            return undefined;
        }
        if (id.includes("anilist.co")) {
            return id.split("https://anilist.co/")[1].split("/")[1];
        } else {
            return id;
        }
    }

    public async search(query:string, page?:number, perPage?:number, type?:Type["ANIME"]|Type["MANGA"], format?:Format, sort?:Sort): Promise<SearchResponse> {
        page = page ? page : 0;
        perPage = perPage ? perPage : 18;
        type = type ? type : this.type;
        format = format ? format : this.format;
        sort = sort ? sort : Sort.POPULARITY_DESC;
        this.format = format;
        if (!this.type || !this.format) {
            throw new Error("No format/type provided.");
        }

        const aniListArgs = {
            query: `
            query($page: Int, $perPage: Int, $search: String, $type: MediaType, $sort: [MediaSort], $format: MediaFormat) {
                Page(page: $page, perPage: $perPage) {
                    pageInfo {
                        total
                        currentPage
                        lastPage
                        hasNextPage
                        perPage
                    }
                    media(type: $type, search: $search, sort: $sort, format: $format) {
                        ${this.query}
                    }
                }
            }
            `,
            variables: {
                search: query,
                page: page,
                perPage: perPage,
                type: type,
                format: format,
                sort: sort
            }
        }

        try {
            const req = await this.fetch(this.api, {
                body: JSON.stringify(aniListArgs),
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                }
            });
    
            const data:SearchResponse = req.json();
            if (!data || !data.data || !data.data.Page.pageInfo || !data.data.Page.media) {
                throw new Error(req.text());
            }
    
            return data;
        } catch (e) {
            throw new Error(e.message);
        }
    }

    public async searchGenres(included?:Genres[], excluded?:Genres[], page?:number, perPage?:number, type?:Type["ANIME"]|Type["MANGA"], format?:Format, sort?:Sort): Promise<SearchResponse> {
        included = included ? included : [];
        excluded = excluded ? excluded : [];
        page = page ? page : 0;
        perPage = perPage ? perPage : 18;
        type = type ? type : this.type;
        format = format ? format : this.format;
        sort = sort ? sort : Sort.POPULARITY_DESC;
        this.format = format;

        const aniListArgs = {
            query: `
            query($page: Int, $perPage: Int, $type: MediaType, $format: [MediaFormat], $genres: [String], $excludedGenres: [String], $sort: [MediaSort]) {
                Page(page: $page, perPage: $perPage) {
                    pageInfo {
                        total
                        currentPage
                        lastPage
                        hasNextPage
                        perPage
                    }
                    media(type: $type, format_in: $format, genre_in: $genres, genre_not_in: $excludedGenres, sort: $sort) {
                        ${this.query}
                    }
                }
            }
            `,
            variables: {
                page: page,
                perPage: perPage,
                type: type,
                format: format,
                sort: sort,
                genres: included,
                excludedGenres: excluded
            }
        }

        try {
            const req = await this.fetch(this.api, {
                body: JSON.stringify(aniListArgs),
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                }
            });
    
            const data:SearchResponse = req.json();
            if (!data || !data.data || !data.data.Page.pageInfo || !data.data.Page.media) {
                throw new Error(req.text());
            }
    
            return data;
        } catch (e) {
            throw new Error(e.message);
        }
    }

    public async malToAniList(id?:string, type?:Type["ANIME"]|Type["MANGA"], wait?:number):Promise<string> {
        if (!this.isMal) {
            id = id ? id : this.id;
            type = type ? type : this.type;
        } else {
            id = this.id;
            type = type ? type : this.type;
        }

        if (!type || !id) {
            throw new Error("No format or id provided.");
        }

        const aniListArgs = {
            query: `
            query ($id: Int, $format: MediaType) {
                Media(idMal: $id, type: $format) {
                    id
                    idMal
                }
            }
            `,
            variables: { "id": id, "format": type }
        }

        if (wait) {
            await this.wait(wait);
        }
        try {
            const req = await this.fetch(this.api, {
                body: JSON.stringify(aniListArgs),
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                }
            });
    
            const data = req.json();
            if (!data || !data.data || !data.data.Media.id) {
                throw new Error(req.text());
            }
    
            this.id = data.data.Media.id;
            this.type = type;
    
            return data.data.Media.id;
        } catch (e) {
            throw new Error(e.message);
        }
    }

    public async getInfo(wait?:number): Promise<AniListResponse> {
        let aniListArgs;

        if (!this.format || !this.id) {
            throw new Error("No format or id provided.");
        }

        if (this.isMal) {
            aniListArgs = {
                query: `
                query($id: Int, $format: MediaType) {
                    Media(idMal: $id, type: $format) {
                        ${this.query}
                    }
                }
                `,
                variables: { "id": this.id, "format": this.format }
            };
        } else {
            aniListArgs = {
                query: `
                query($id: Int) {
                    Media(idMal: $id) {
                        ${this.query}
                    }
                }
                `,
                variables: { "id": this.id }
            };
        }

        if (wait) {
            await this.wait(wait);
        }
        try {
            const req = await this.fetch(this.api, {
                body: JSON.stringify(aniListArgs),
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                }
            });

            if (!req) {
                throw new Error("Request failed.")
            }
    
            const data = req.json();
            if (!data || !data.data || !data.data.Media.id) {
                throw new Error(req.text());
            }
            return data;
        } catch (e) {
            throw new Error(e.message);
        }
    }

    public updateId(id:string) {
        this.id = id;
    }

    public updateType(type:Type["ANIME"]|Type["MANGA"]) {
        this.type = type;
    }

    public updateMal(isMal:boolean) {
        this.isMal = isMal;
    }

    public async getSeasonal(page?:number, perPage?:number, type?:Type["ANIME"]|Type["MANGA"]): Promise<SeasonalResponse> {
        page = page ? page : 0;
        perPage = perPage ? perPage : 6;
        type = type ? type : this.type;

        if (!type) {
            throw new Error("No type specified.");
        }

        const aniListArgs = {
            query: `
            query($season: MediaSeason, $seasonYear: Int, $nextSeason: MediaSeason, $nextYear: Int) {
                trending: Page(page: ${page}, perPage: ${perPage}) {
                    media(sort: TRENDING_DESC, type: ${type}, isAdult: false) {
                        ...media
                    }
                }
                season: Page(page: ${page}, perPage: ${perPage}) {
                    media(season: $season, seasonYear: $seasonYear, sort: POPULARITY_DESC, type: ${type}, isAdult: false) {
                        ...media
                    }
                }
                nextSeason: Page(page: ${page}, perPage: ${perPage}) {
                    media(season: $nextSeason, seasonYear: $nextYear, sort: POPULARITY_DESC, type: ${type}, isAdult: false) {
                        ...media
                    }
                }
                popular: Page(page: ${page}, perPage: ${perPage}) {
                    media(sort: POPULARITY_DESC, type: ${type}, isAdult: false) {
                        ...media
                    }
                }
                top: Page(page: ${page}, perPage: ${perPage}) {
                    media(sort: SCORE_DESC, type: ${type}, isAdult: false) {
                        ...media
                    }
                }
            }
            
            fragment media on Media {
                ${this.query}
            }
            `,
            variables: {
                "type": type,
                "season": this.config.SEASON,
                "seasonYear": this.config.SEASON_YEAR,
                "nextSeason": this.config.NEXT_SEASON,
                "nextYear": this.config.NEXT_YEAR
            }
        }

        try {
            const req = await this.fetch(this.api, {
                body: JSON.stringify(aniListArgs),
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                }
            });
    
            const data = req.json();
            if (!data || !data.data) {
                throw new Error(req.text());
            }
            return data;
        } catch (e) {
            throw new Error(e.message);
        }
    }
}

interface Type {
    ANIME: "ANIME",
    MANGA: "MANGA"
}

export enum Format {
    TV = "TV",
    TV_SHORT = "TV_SHORT",
    MOVIE = "MOVIE",
    SPECIAL = "SPECIAL",
    OVA = "OVA",
    ONA = "ONA",
    MUSIC = "MUSIC",
    MANGA = "MANGA",
    NOVEL = "NOVEL",
    ONE_SHOT = "ONE_SHOT"
}

export enum Sort {
    ID = "ID",
    ID_DESC = "ID_DESC",
    TITLE_ROMAJI = "TITLE_ROMAJI",
    TITLE_ROMAJI_DESC = "TITLE_ROMAJI_DESC",
    TYPE = "TYPE",
    FORMAT = "FORMAT",
    FORMAT_DESC = "FORMAT_DESC",
    SCORE = "SCORE",
    SCORE_DESC = "SCORE_DESC",
    POPULARITY = "POPULARITY",
    POPULARITY_DESC = "POPULARITY_DESC",
    TRENDING = "TRENDING",
    TRENDING_DESC = "TRENDING_DESC",
    CHAPTERS = "CHAPTERS",
    CHAPTERS_DESC = "CHAPTERS_DESC",
    VOLUMES = "VOLUMES",
    UPDATED_AT = "UPDATED_AT",
    UPDATED_AT_DESC = "UPDATED_AT_DESC"
}

export enum Genres {
    ACTION = "Action",
    ADVENTURE = "Adventure",
    COMEDY = "Comedy",
    DRAMA = "Drama",
    ECCHI = "Ecchi",
    FANTASY = "Fantasy",
    HORROR = "Horror",
    MAHOU_SHOUJO = "Mahou Shoujo",
    MECHA = "Mecha",
    MUSIC = "Music",
    MYSTERY = "Mystery",
    PSYCHOLOGICAL = "Psychological",
    ROMANCE = "Romance",
    SCI_FI = "Sci-Fi",
    SLICE_OF_LIFE = "Slice of Life",
    SPORTS = "Sports",
    SUPERNATURAL = "Supernatural",
    THRILLER = "Thriller"
}

interface AniListResponse {
    data: {
        Media: Media;
    }
}

interface Media {
    id:number;
    idMal:number;
    title: Title;
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
    type:Type["ANIME"]|Type["MANGA"];
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
    streamingEpisodes: {
        title?:string;
        thumbnail?:string;
        url?:string;
    };
    trailer: {
        id:string;
        site:string;
    };
    tags: {
        id:number;
        name:string;
    };
};

interface Title {
    english?: string;
    romaji?: string;
    native?: string;
}

interface RelationsNode {
    id:number;
    relationType:string;
    node: {
        id:number;
        title: {
            userPreferred:string;
        };
        format:Format;
        type:Type["ANIME"]|Type["MANGA"];
        status:string;
        bannerImage:string;
        coverImage: {
            large:string;
        }
    };
}

interface SearchResponse {
    data: {
        Page: {
            pageInfo: {
                total: number;
                currentPage: number;
                lastPage: number;
                hasNextPage: boolean;
                perPage: number;
            }
            media: Array<Media>
        }
    }
}

interface SeasonalResponse {
    data: {
        trending: {
            media: Array<Media>
        },
        season: {
            media: Array<Media>
        },
        nextSeason: {
            media: Array<Media>
        },
        popular: {
            media: Array<Media>
        },
        top: {
            media: Array<Media>
        }
    }
}

export type { Type, Media, SearchResponse, SeasonalResponse };