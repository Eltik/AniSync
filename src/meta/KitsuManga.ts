import { ProviderType } from "../types/API";
import Provider from "../types/Provider";
import { Result } from "../Core";
import { Format } from "./AniList";

export default class KitsuManga extends Provider {
    private api = 'https://kitsu.io/api/edge';

    constructor() {
        super("https://kitsu.io", ProviderType.MANGA, [Format.MANGA, Format.ONE_SHOT, Format.NOVEL], "KitsuManga");
        this.rateLimit = 250;
    }

    public async search(query:string): Promise<Array<Result>> {
        const results:Result[] = [];

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
            const data:SearchResponse = req.json();
            if (data.data.length > 0) {
                data.data.forEach((result) => {
                    const altTitles = [];
                    if (result.attributes.titles.en_jp) {
                        altTitles.push(result.attributes.titles.en_jp);
                    }
                    if (result.attributes.titles.ja_jp) {
                        altTitles.push(result.attributes.titles.ja_jp);
                    }
                    if (result.attributes.titles.en_us) {
                        altTitles.push(result.attributes.titles.en_us);
                    }
                    if (result.attributes.titles.en) {
                        altTitles.push(result.attributes.titles.en);
                    }
                    if (result.attributes.titles.en_kr) {
                        altTitles.push(result.attributes.titles.en_kr);
                    }
                    if (result.attributes.titles.ko_kr) {
                        altTitles.push(result.attributes.titles.ko_kr);
                    }
                    if (result.attributes.titles.en_cn) {
                        altTitles.push(result.attributes.titles.en_cn);
                    }
                    if (result.attributes.titles.zh_cn) {
                        altTitles.push(result.attributes.titles.zh_cn);
                    }
                    results.push({
                        title: result.attributes.titles.en_us || result.attributes.titles.en_jp || result.attributes.titles.ja_jp || result.attributes.titles.en || result.attributes.titles.en_kr || result.attributes.titles.ko_kr || result.attributes.titles.en_cn || result.attributes.titles.zh_cn || result.attributes.canonicalTitle || result.attributes.slug,
                        altTitles: altTitles,
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

interface SearchResponse {
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
        en_kr: string;
        ko_kr: string;
        en_cn: string;
        zh_cn: string;
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