import Manga, { SearchResponse } from "./Manga";

export default class Mangakakalot extends Manga {
    private types = {
        CHAPMAGNANATO: "https://chapmanganato.com",
        READMANGANATO: "https://readmanganato.com",
        MANGAKAKALOT: this.baseUrl
    };

    constructor() {
        super("https://mangakakalot.com", "Mangakakalot");
    }

    public async search(query:string): Promise<Array<SearchResponse>> {
        // https://mangakakalot.com/home_json_tooltips
        const data = await this.fetch(`${this.baseUrl}/home_json_search`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
            },
            body: `searchword=${this.parseQuery(query)}`
        });
        const json = data.json();
        const results = json.map((result:SearchResult) => {
            const uri = new URL(result.story_link);
            return {
                url: uri.href,
                title: this.parseTitle(result.name),
                id: uri.href.split("https://")[1],
                img: result.image
            };
        });
        return results;
    }

    // Change alias function from Mangakakalot
    private parseQuery(query:string):string {
        let str = query ? query : "";
        str = str.toLowerCase();
        str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
        str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
        str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
        str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
        str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
        str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
        str = str.replace(/đ/g, "d");
        str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'| |\"|\&|\#|\[|\]|~|-|$|_/g, "_");
        str = str.replace(/_+_/g, "_");
        str = str.replace(/^\_+|\_+$/g, "");
        return str;
    }

    private parseTitle(name:string) {
        return name.replace("<span class=\"search_result_title_red\">", "").replace("</span>", "");
    }

    private parseType(id:string) {
        const type = id.includes("manganato.com") ? id.includes("chapmanganato") ? this.types.CHAPMAGNANATO : this.types.READMANGANATO : this.types.MANGAKAKALOT;
        return type;
    }
}

interface SearchResult {
    id: string;
    name: string;
    nameunsigned: string;
    lastchapter: string;
    image: string;
    author: string;
    story_link: string;
}