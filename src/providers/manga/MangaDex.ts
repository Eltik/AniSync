import { config } from "../../config";
import Manga, { SearchResponse } from "./Manga";

export default class MangaDex extends Manga {
    private api:string = "https://api.mangadex.org";
    private config = config.mapping.provider.MangaDex;

    constructor() {
        super("https://mangadex.org", "MangaDex");
    }

    public async search(query:string): Promise<Array<SearchResponse>> {
        let mangaList = [];
        const results = [];

        for (let page = 0; page <= 1; page += 1) {
            const uri = new URL('/manga', this.api);
            uri.searchParams.set('title', query);
            uri.searchParams.set('limit', "25");
            uri.searchParams.set('offset', String(25 * page).toString());
            uri.searchParams.set('order[createdAt]', 'asc');
            uri.searchParams.append('contentRating[]', 'safe');
            uri.searchParams.append('contentRating[]', 'suggestive');
            uri.searchParams.append('contentRating[]', 'erotica');
            uri.searchParams.append('contentRating[]', 'pornographic');

            const request = await this.fetchJSON(uri.href);
            await this.wait(this.config.wait);

            mangaList = [...mangaList, ...request.json().data];
        }
        for (let i = 0; i < mangaList.length; i++) {
            const manga = mangaList[i];
            const attributes:MangaAttributes = manga.attributes;
            const relationships:Array<MangaRelationship>|null = manga.relationships;

            const title = attributes.title["en"];
            let romaji = undefined;
            let native = undefined;
            let korean = undefined;
            
            attributes.altTitles.map((element, index) => {
                const title = element;
                if (title["ja-ro"] != undefined) {
                    romaji = title["ja-ro"];
                }
                if (title["ja"] != undefined) {
                    native = title["ja"];
                }
                if (title["ko"] != undefined) {
                    korean = title["ko"];
                }
            })

            if (!native && korean != undefined) {
                native = korean;
            }

            const id = manga.id;
            const url = `${this.baseUrl}/title/${id}`;
            let img = "";
            relationships.map((element:MangaRelationship) => {
                if (element.type === "cover_art") {
                    img = `${this.baseUrl}/covers/${id}/${element.id}.jpg.512.jpg`;
                }
            })

            results.push({
                url: url,
                title: title,
                id: id,
                img: img,
                romaji: romaji,
                native: native
            })
        }
        return results;
    }
}

interface MangaAttributes {
    title: { en?: string }|any;
    altTitles: [];
    description: { en?: string }|any;
    isLocked: boolean;
    links: any;
    originalLanguage: string;
    lastVolume: string;
    lastChapter: string;
    publicationDemographic: string;
    status: string;
    year: number;
    contentRating: string;
    tags: Array<MangaTag>;
    state: string;
    chapterNumbersResetOnNewVolume: boolean;
    createdAt: string;
    updatedAt: string;
    version: number;
    availableTranslatedLanguages: any;
    latestUploadedChapter: any;
}

interface MangaTag {
    id: string;
    type: string;
    attributes: any;
    relationships: any;
}

interface MangaRelationship {
    id: string;
    type: string;
}