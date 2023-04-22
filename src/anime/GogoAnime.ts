import { load } from "cheerio";
import Provider from "../types/Provider";
import { ProviderType } from "../types/API";
import { Result } from "../Core";
import { Format } from "../meta/AniList";

export default class GogoAnime extends Provider {
    private api = "https://ajax.gogo-load.com/ajax";

    constructor() {
        super("https://www1.gogoanime.bid", ProviderType.ANIME, [Format.MOVIE, Format.ONA, Format.OVA, Format.SPECIAL, Format.TV, Format.TV_SHORT], "GogoAnime");
        this.altURLs = [
            "https://gogoanime.lu",
            "https://gogoanime.tel",
            "https://gogoanime.ee",
            "https://gogoanime.dk",
            "https://gogoanime.ar",
            "https://gogoanime.bid",
        ]
    }

    public async search(query:string): Promise<Array<Result>> {
        const dom = await this.fetch(`${this.baseURL}/search.html?keyword=${encodeURIComponent(query)}`);
        const results = [];

        const $ = load(dom.text());

        $("div.last_episodes > ul > li").map((index, element) => {
            const title = $(element).find('p.name > a').attr('title')!;
            const id = "/category/" + $(element).find('p.name > a').attr('href')?.split('/')[2]!;
            const url = this.baseURL + id;

            results.push({
                url,
                title: title
            })
        })

        return results;
    }

    public async fetchRecentEpisodes(page: number = 1, type: number = 1): Promise<RecentEpisode[]> {
        try {
            const res = await this.fetch(`${this.api}/page-recent-release.html?page=${page}&type=${type}`);

            const $ = load(res.text());

            const recentEpisodes = [];

            $('div.last_episodes.loaddub > ul > li').each((i, el) => {
                recentEpisodes.push({
                    id: $(el).find('a').attr('href')?.split('-episode')[0]!,
                    episodeId: $(el).find('a').attr('href')?.split('/')[1]!,
                    episodeNumber: parseInt($(el).find('p.episode').text().replace('Episode ', '')),
                    title: $(el).find('p.name > a').attr('title')!,
                    image: $(el).find('div > a > img').attr('src'),
                    url: `${this.baseURL}${$(el).find('a').attr('href')?.trim()}`,
                });
            });
            return recentEpisodes;
        } catch (err) {
            throw new Error('Something went wrong. Please try again later.');
        }
    };
}

interface RecentEpisode {
    id: string;
    episodeId: string;
    episodeNumber: number;
    title: string;
    image: string;
    url: string;
}