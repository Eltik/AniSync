import axios from "axios";
import { Format, Formats, Result, Type } from "../..";
import MetaProvider from ".";

export default class KitsuManga extends MetaProvider {
    override rateLimit = 250;
    override id = "kitsu";
    override url = "https://kitsu.io";
    override formats: Format[] = [Format.MANGA, Format.ONE_SHOT, Format.NOVEL];

    private kitsuApiUrl = "https://kitsu.io/api/edge";
    
    override async search(query: string): Promise<Result[] | undefined> {
        const results:Result[] = [];

        const searchUrl = `/manga?filter[text]=${encodeURIComponent(query)}`;
        const req = await axios(this.kitsuApiUrl + searchUrl, {
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
        const data = req.data;
        if (data.data.length > 0) {
            data.data.forEach((result) => {
                const altTitles: string[] = [];
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

                const formatString: string = result.attributes.subtype.toUpperCase();
                const format: Format = Formats.includes(formatString as Format) ? formatString as Format : Format.UNKNOWN;
                
                results.push({
                    title: result.attributes.titles.en_us || result.attributes.titles.en_jp || result.attributes.titles.ja_jp || result.attributes.titles.en || result.attributes.titles.en_kr || result.attributes.titles.ko_kr || result.attributes.titles.en_cn || result.attributes.titles.zh_cn || result.attributes.canonicalTitle || result.attributes.slug,
                    altTitles: altTitles,
                    id: result.id,
                    img: result.attributes.posterImage.original,
                    format,
                    year: result.attributes.startDate ? new Date(result.attributes.startDate).getFullYear() : 0,
                    providerId: this.id,
                });
            });
            return results;
        } else {
            return results;
        }
    }
}