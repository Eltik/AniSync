import { wait } from "@/src/helper";
import MangaProvider from ".";
import { Format, Result } from "../..";
import axios from "axios";

export default class MangaDex extends MangaProvider {
    override id: string = "mangadex";
    override url: string = "https://mangadex.org";

    override formats: Format[] = [Format.MANGA, Format.ONE_SHOT];

    private api: string = "https://api.mangadex.org";

    override async search(query: string): Promise<Result[] | undefined> {
        const results:Result[] = [];

        let mangaList:any[] = [];

        for (let page = 0; page <= 1; page += 1) {
            const uri = new URL('/manga', this.api);
            uri.searchParams.set('title', query);
            uri.searchParams.set('limit', "25");
            uri.searchParams.set('offset', String(25 * page).toString());
            uri.searchParams.set('order[relevance]', 'desc');
            uri.searchParams.append('contentRating[]', 'safe');
            uri.searchParams.append('contentRating[]', 'suggestive');
            uri.searchParams.append('contentRating[]', 'erotica');
            uri.searchParams.append('contentRating[]', 'pornographic');
            uri.searchParams.append("includes[]", "cover_art");

            const request = await axios(uri.href);
            // API rate limit
            await wait(250);

            mangaList = ([...mangaList, ...request.data.data]);
        }

        for (let i = 0; i < mangaList.length; i++) {
            const manga = mangaList[i];
            const attributes = manga.attributes;
            const relationships = manga.relationships;

            const title = attributes.title["en"] ?? attributes.title["ja"] ?? attributes.title["ja-ro"] ?? attributes.title["ko"];
            
            const altTitles: string[] = [];
            
            attributes.altTitles.map((element, index) => {
                const temp = element;
                if (temp["ja-ro"] != undefined) {
                    altTitles.push(temp["ja-ro"]);
                }
                if (temp["ja"] != undefined) {
                    altTitles.push(temp["ja"]);
                }
                if (temp["ko"] != undefined) {
                    altTitles.push(temp["ko"]);
                }
                if (temp["en"] != undefined) {
                    altTitles.push(temp["en"]);
                }
            })

            const id = manga.id;
            let img = "";
            relationships.map((element) => {
                if (element.type === "cover_art") {
                    img = `${this.url}/covers/${id}/${element.id}.jpg.512.jpg`;
                }
            })

            results.push({
                id,
                title: title,
                altTitles: altTitles,
                img: img,
                providerId: this.id,
            })
        }
        return results;
    }
}