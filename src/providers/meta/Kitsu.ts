import { config } from "../../config";
import Meta, { SearchResponse } from "./Meta";

export default class Kitsu extends Meta {
    private api = 'https://kitsu.io/api/edge';

    constructor() {
        super("https://kitsu.io", "Kitsu");
    }

    public async searchAnime(query:string): Promise<Array<SearchResponse>> {
        const results:SearchResponse[] = [];

        const searchUrl = `/anime?filter[text]=${encodeURIComponent(query)}`;

        try {
            const req = await this.fetch(this.api + searchUrl, {
                headers: {
                    "Accept": "application/vnd.api+json",
                    "Content-Type": "application/vnd.api+json"
                }
            }).catch((err) => {
                return null;
            });
            if (!req) {
                return results;
            }
            const data:Result = req.json();
            if (data.data.length > 0) {
                data.data.forEach((result) => {
                    results.push({
                        id: result.id,
                        title: result.attributes.titles.en_us,
                        romaji: result.attributes.titles.en_jp,
                        native: result.attributes.titles.ja_jp,
                        year: result.attributes.startDate?.split('-')[0], // Kitsu year returns in YYYY-MM-DD format
                        format: result.attributes.subtype,
                        img: result.attributes.posterImage.original,
                        url: result.links.self,
                    });
                });
                return results;
            } else {
                return results;
            }
        } catch (e) {
            throw new Error(e);
        }
    }

    public async searchManga(query:string): Promise<Array<SearchResponse>> {
        const results:SearchResponse[] = [];

        const searchUrl = `/manga?filter[text]=${encodeURIComponent(query)}`;

        try {
            const req = await this.fetch(this.api + searchUrl, {
                headers: {
                    "Accept": "application/vnd.api+json",
                    "Content-Type": "application/vnd.api+json"
                }
            }).catch((err) => {
                return null;
            });
            if (!req) {
                return results;
            }
            const data:Result = req.json();
            if (data.data.length > 0) {
                data.data.forEach((result) => {
                    results.push({
                        id: result.id,
                        title: result.attributes.titles.en,
                        romaji: result.attributes.titles.en_jp,
                        native: result.attributes.titles.ja_jp,
                        year: result.attributes.startDate?.split('-')[0], // Kitsu year returns in YYYY-MM-DD format
                        format: result.attributes.subtype,
                        img: result.attributes.posterImage.original,
                        url: result.links.self,
                    });
                });
                return results;
            } else {
                return results;
            }
        } catch (e) {
            throw new Error(e);
        }
    }
}

interface Result {
    data: [Data];
}

interface Data {
    id: string;
    type: "anime"|"manga";
    links: {
        self: string;
    };
    attributes: Attributes;
    relationships: Relationships;
}

interface Relationships {
    categories: {
        links: {
            self: string;
            related: string;
        };
    };
    castings: {
        links: {
            self: string;
            related: string;
        };
    };
    installments: {
        links: {
            self: string;
            related: string;
        };
    };
    mappings: {
        links: {
            self: string;
            related: string;
        };
    };
    reviews: {
        links: {
            self: string;
            related: string;
        };
    };
    mediaRelationships: {
        links: {
            self: string;
            related: string;
        };
    };
    quotes: {
        links: {
            self: string;
            related: string;
        };
    };
    episodes: {
        links: {
            self: string;
            related: string;
        };
    };
    streamingLinks: {
        links: {
            self: string;
            related: string;
        };
    };
    animeProductions: {
        links: {
            self: string;
            related: string;
        };
    };
    animeCharacters: {
        links: {
            self: string;
            related: string;
        };
    };
    animeStaff: {
        links: {
            self: string;
            related: string;
        };
    };
    genres: {
        links: {
            self: string;
            related: string;
        };
    };
}

interface Attributes {
    createdAt: string;
    updatedAt: string;
    slug: string;
    synopsis: string;
    description: string;
    coverImageTopOffset: number;
    titles: {
        en: string;
        en_jp: string;
        en_us: string;
        ja_jp: string;
    };
    canonicalTitle: string;
    abbreviatedTitles: string[];
    averageRating: string;
    ratingFrequencies: {
        "2": string;
        "3": string;
        "4": string;
        "5": string;
        "6": string;
        "7": string;
        "8": string;
        "9": string;
        "10": string;
        "11": string;
        "12": string;
        "13": string;
        "14": string;
        "15": string;
        "16": string;
        "17": string;
        "18": string;
        "19": string;
        "20": string;
    };
    userCount: number;
    favoritesCount: number;
    startDate: string;
    endDate: string;
    nextRelease: string;
    popularityRank: number;
    ratingRank: number;
    ageRating: string;
    ageRatingGuide: string;
    subtype: string;
    status: string;
    tba?: string;
    posterImage?: {
        tiny: string;
        small: string;
        medium: string;
        large: string;
        original: string;
        meta: {
            dimensions: {
                tiny: {
                    width?: number;
                    height?: number;
                };
                small: {
                    width?: number;
                    height?: number;
                };
                medium: {
                    width?: number;
                    height?: number;
                };
                large: {
                    width?: number;
                    height?: number;
                };
            };
        };
    };
    coverImage?: {
        tiny: string;
        small: string;
        large: string;
        original: string;
        meta: {
            dimensions: {
                tiny: {
                    width?: number;
                    height?: number;
                };
                small: {
                    width?: number;
                    height?: number;
                };
                large: {
                    width?: number;
                    height?: number;
                };
            };
        };
    };
    episodeCount?: number;
    episodeLength?: number;
    totalLength?: number;
    youtubeVideoId?: string;
    showType?: string;
    nsfw?: boolean;
    chapterCount?: number;
    volumeCount?: number;
    serialization?: string;
    mangaType?: string;
}