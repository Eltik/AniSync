// https://api.animethemes.moe/image?filter[facet]=Grill&sort=random&page[size]=1
import { load } from "cheerio";
import { ProviderType } from "../types/API";
import Provider from "../types/Provider";
import { Result } from "../Core";
import { Format } from "./AniList";

export default class AnimeThemes extends Provider {
    private graphql:string = "https://animethemes.moe/api/graphql";
    private api:string = "https://api.animethemes.moe";

    constructor() {
        super("https://animethemes.moe", ProviderType.ANIME, [Format.MOVIE, Format.ONA, Format.OVA, Format.SPECIAL, Format.TV, Format.TV_SHORT], "AnimeThemes");
        this.rateLimit = 500;
    }

    public async search(query:string): Promise<Array<Result>> {
        const req = await this.fetch(`${this.api}/search?page%5Blimit%5D=4&fields%5Bsearch%5D=anime%2Canimethemes%2Cartists%2Cseries%2Cstudios&q=${encodeURIComponent(query)}&include%5Banime%5D=animethemes.animethemeentries.videos%2Canimethemes.song%2Cimages&include%5Banimetheme%5D=animethemeentries.videos%2Canime.images%2Csong.artists&include%5Bartist%5D=images%2Csongs&fields%5Banime%5D=name%2Cslug%2Cyear%2Cseason&fields%5Banimetheme%5D=type%2Csequence%2Cslug%2Cgroup%2Cid&fields%5Banimethemeentry%5D=version%2Cepisodes%2Cspoiler%2Cnsfw&fields%5Bvideo%5D=tags%2Cresolution%2Cnc%2Csubbed%2Clyrics%2Cuncen%2Csource%2Coverlap&fields%5Bimage%5D=facet%2Clink&fields%5Bsong%5D=title&fields%5Bartist%5D=name%2Cslug%2Cas&fields%5Bseries%5D=name%2Cslug&fields%5Bstudio%5D=name%2Cslug`);
        const data:SearchResult = req.json();

        const results:Array<Result> = [];
        data.search.anime.map((element, index) => {
            results.push({
                title: element.name,
                url: `${this.baseURL}/anime/${element.slug}`,
            })
        })
        return results;
    }

    public async getThemes(id:string): Promise<Theme[]> {
        const req = await this.fetch(`${this.baseURL}${id}`);
        const $ = load(req.text());
        const props = JSON.parse($("#__NEXT_DATA__").html()).props.pageProps;
        const themes:[Theme] = props.anime.themes;
        // Can access themes via `${this.baseURL}/anime/${slug}/${OP/ED/ED1/etc.}`
        // And also the file via "https://v.animethemes.moe/${filename}.webm"
        return themes;
    }

    public parseTheme(theme:Theme) {
        const data = [];
        theme.entries.map((entry) => {
            entry.videos.map((video) => {
                data.push(`https://v.animethemes.moe/${video.filename}.webm`);
            })
        })
        return data;
    }

    public async parseThemeHTML(theme:Theme) {
        const req = await this.fetch(`${this.baseURL}/anime/${theme.slug}/${theme.type}`);
        const $ = load(req.text());
        return $(`meta[property="og:video"]`).attr("content");
    }

    public async getArtist(query:string): Promise<ArtistResult> {
        const req = await this.fetch(`${this.api}/artist?page%5Bsize%5D=15&page%5Bnumber%5D=1&q=${encodeURIComponent(query)}&include=images`);
        const data:ArtistResult = req.json();
        return data;
    }

    // Fetches pfp images
    public async getImage(): Promise<ImageResponse> {
        const req = await this.fetch(`${this.api}/image?filter[facet]=Grill&sort=random&page[size]=1`);
        const data = req.json();
        return data;
    }

    public async getRecentlyAdded(): Promise<RecentlyAdded> {
        const req = await this.fetch(`${this.graphql}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                Referer: this.baseURL
            },
            body: JSON.stringify({
                operationName: "RecentlyAdded",
                variables: {},
                query: `fragment SongTitleSong on Song {\n  title\n  __typename\n}\n\nfragment PerformancesSong on Song {\n  performances {\n    as\n    artist {\n      slug\n      name\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nfragment SongTitleWithArtistsSong on Song {\n  ...SongTitleSong\n  ...PerformancesSong\n  __typename\n}\n\nfragment extractImagesResourceWithImages on ResourceWithImages {\n  images {\n    link\n    facet\n    __typename\n  }\n  __typename\n}\n\nfragment createVideoSlugTheme on Theme {\n  slug\n  __typename\n}\n\nfragment createVideoSlugEntry on Entry {\n  version\n  __typename\n}\n\nfragment createVideoSlugVideo on Video {\n  tags\n  __typename\n}\n\nfragment ThemeMenuTheme on Theme {\n  id\n  song {\n    title\n    __typename\n  }\n  __typename\n}\n\nfragment ThemeSummaryCardTheme on Theme {\n  ...createVideoSlugTheme\n  ...ThemeMenuTheme\n  slug\n  type\n  sequence\n  group\n  anime {\n    ...extractImagesResourceWithImages\n    slug\n    name\n    __typename\n  }\n  song {\n    ...SongTitleWithArtistsSong\n    __typename\n  }\n  entries {\n    ...createVideoSlugEntry\n    videos {\n      ...createVideoSlugVideo\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nquery RecentlyAdded {\n  recentlyAdded: themeAll(\n    orderBy: \"id\"\n    orderDesc: true\n    limit: 10\n    has: \"animethemeentries.videos,song\"\n  ) {\n    ...ThemeSummaryCardTheme\n    __typename\n  }\n}\n`
            })
        });
        const data = req.json();
        return data;
    }
}

interface SearchResult {
    search: {
        anime: [Anime];
        animethemes: [Theme];
        artists: [any];
        series: [any];
        studios: [any];
    };
}

interface Anime {
    name: string;
    slug: string;
    year: number;
    season: string;
    images: [Image];
    animethemes: [Theme];
}

interface Theme {
    id: number;
    type: string;
    sequence: number|null;
    slug: string;
    group: number|null;
    song: {
        title: string;
    };
    animethemeentries?: [Entry];
    entries?: [Entry];
    anime?: {
        name: string;
        slug: string;
    };
}

interface ImageResponse {
    images: [Image];
    links: [Link];
    meta: {
        current_page: number;
        from: number;
        path: string;
        per_page: number;
        to: number;
    };
}

interface Image {
    id?: number;
    path?: string;
    facet: string;
    created_at?: string|null;
    updated_at?: string|null;
    deleted_at?: string|null;
    link: string;
    __typename?: string;
}

interface Link {
    first: string|null;
    last: string|null;
    prev: string|null;
    next: string|null;
}

interface RecentlyAdded {
    data: {
        recentlyAdded: [RecentResult];
    }
}

interface RecentResult {
    slug: string;
    __typename: string;
    id: number;
    song: {
        title: string;
        __typename: string;
        performances: [Performance];
    };
    type: string;
    sequence: number;
    group: number|null;
    anime: {
        slug: string;
        name: string;
        __typename: string;
        images: [Image];
    };
    entries: [Entry];
}

interface Performance {
    as: string|null;
    artist: {
        slug: string;
        name: string;
        __typename: string;
    }
    __typename: string;
}

interface Entry {
    version: number;
    videos: [Video];
    __typename: string;
}

interface Video {
    tags: [string];
    __typename: string;
    resolution: number;
    nc: boolean;
    subbed: boolean;
    lyrics: boolean;
    uncen: boolean;
    source: string;
    overlap: string;
    filename: string;
}

interface ArtistResult {
    artists: [Artist];
    links: [Link];
    meta: {
        current_page: number;
        from: number;
        path: string;
        per_page: number;
        to: number;
        links: [Link];
    };
}

interface Artist {
    created_at: string;
    updated_at: string;
    id: number;
    name: string;
    slug: string;
    images: [Image];
}

export type { Theme };