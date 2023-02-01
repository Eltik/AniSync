import { ProviderType } from "../API";
import Provider from "../Provider";

export default class AniList extends Provider {
    private api:string = "https://graphql.anilist.co";
    public id:string = undefined;
    public type:Type = undefined;

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

    constructor() {
        super("https://anilist.co", ProviderType.META);
    }

    public async search(query:string, type:Type, page?:number, perPage?:number): Promise<Media[]> {
        page = page ? page : 0;
        perPage = perPage ? perPage : 10;
        const aniListArgs = {
            query: `
            query($page: Int, $perPage: Int, $search: String, $type: MediaType) {
                Page(page: $page, perPage: $perPage) {
                    pageInfo {
                        total
                        currentPage
                        lastPage
                        hasNextPage
                        perPage
                    }
                    media(type: $type, search: $search) {
                        ${this.query}
                    }
                }
            }
            `,
            variables: {
                search: query,
                type: type,
                page: page,
                perPage: perPage
            }
        }
        const req = await this.fetch(this.api, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(aniListArgs)
        });
        const data = await req.json();
        return data.data.Page.media;
    }

    public async toMal(id:string): Promise<Number> {
        const query = `query ($id: Int) {
            Media (id: $id, type: MANGA) {
                idMal
            }
        }`;
        const variables = {
            id: parseInt(id)
        };
        const req = await this.fetch(this.api, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                query,
                variables
            })
        });
        const data = await req.json();
        return data.data.Media.idMal;
    }

    public async getAnimeIDs(): Promise<string[]> {
        const req1 = await this.fetch("https://anilist.co/sitemap/anime-0.xml");
        const data1 = await req1.text();
        const req2 = await this.fetch("https://anilist.co/sitemap/anime-1.xml");
        const data2 = await req2.text();

        const ids1 = data1.match(/anime\/([0-9]+)/g).map((id) => {
            return id.replace("anime/", "");
        });

        const ids2 = data2.match(/anime\/([0-9]+)/g).map((id) => {
            return id.replace("anime/", "");
        });
        return ids1.concat(ids2);
    }

    public async getMangaIDs(): Promise<string[]> {
        const req1 = await this.fetch("https://anilist.co/sitemap/manga-0.xml");
        const data1 = await req1.text();
        const req2 = await this.fetch("https://anilist.co/sitemap/manga-1.xml");
        const data2 = await req2.text();

        const ids1 = data1.match(/manga\/([0-9]+)/g).map((id) => {
            return id.replace("manga/", "");
        });

        const ids2 = data2.match(/manga\/([0-9]+)/g).map((id) => {
            return id.replace("manga/", "");
        });
        return ids1.concat(ids2);
    }
}

export async function search(query:string, type:Type, page?:number, perPage?:number): Promise<Media[]> {
    const self = new AniList();
    return await self.search(query, type, page, perPage);
}

export async function getAnimeIDs(): Promise<string[]> {
    const self = new AniList();
    return await self.getAnimeIDs();
}

export async function getMangaIDs(): Promise<string[]> {
    const self = new AniList();
    return await self.getMangaIDs();
}

export enum Type {
    ANIME = "ANIME",
    MANGA = "MANGA"
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
        type:Type;
        status:string;
        bannerImage:string;
        coverImage: {
            large:string;
        }
    };
}

export type { Media };