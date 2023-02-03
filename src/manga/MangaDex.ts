import { ProviderType } from "../API";
import Provider from "../Provider";
import { Result } from "../Sync";

export default class MangaDex extends Provider {
    private api:string = "https://api.mangadex.org";
    private delay:number = 250;

    constructor() {
        super("https://mangadex.org", ProviderType.MANGA);
    }

    public async search(query:string): Promise<Array<Result>> {
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

            const request = await this.fetch(uri.href);
            await this.wait(this.delay);

            mangaList = [...mangaList, ...request.json().data];
        }
        for (let i = 0; i < mangaList.length; i++) {
            const manga = mangaList[i];
            const attributes:MangaAttributes = manga.attributes;
            const relationships:Array<MangaRelationship>|null = manga.relationships;

            const title = attributes.title["en"] ?? attributes.title["ja"] ?? attributes.title["ja-ro"] ?? attributes.title["ko"];
            let romaji = undefined;
            let native = undefined;
            let korean = undefined;
            let en = undefined;
            
            attributes.altTitles.map((element, index) => {
                const temp = element;
                if (temp["ja-ro"] != undefined) {
                    romaji = temp["ja-ro"];
                }
                if (temp["ja"] != undefined) {
                    native = temp["ja"];
                }
                if (temp["ko"] != undefined) {
                    korean = temp["ko"];
                }
                if (temp["en"] != undefined) {
                    en = temp["en"];
                }
            })

            if (!native && korean != undefined) {
                native = korean;
            }

            const id = manga.id;
            const url = `${this.baseURL}/title/${id}`;
            let img = "";
            relationships.map((element:MangaRelationship) => {
                if (element.type === "cover_art") {
                    img = `${this.baseURL}/covers/${id}/${element.id}.jpg.512.jpg`;
                }
            })

            results.push({
                url: url,
                title: title ?? romaji ?? native ?? en,
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