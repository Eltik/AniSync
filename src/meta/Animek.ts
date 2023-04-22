import { ProviderType } from "../types/API";
import Provider from "../types/Provider";
import { FormattedResponse, Result } from "../Core";
import AniDb from "./AniDb";
import { Type } from "./AniList";

export default class Animek extends Provider {
    private anidb = new AniDb();

    constructor() {
        super("https://animek.fun", ProviderType.META, [], "Animek");
    }

    public async search(query:string): Promise<Array<Result>> {
        // https://animek.fun/api/search_title?q=test
        throw new Error("Not implemented yet.");
    }

    public async getSchedule(start:number = 0, max:number = 10): Promise<ScheduleResult[]> {
        // https://animek.fun/api/schedule
        const req = await this.fetch(`${this.baseURL}/api/schedule`);
        const data:ScheduleResponse[] = req.json();
        const result:ScheduleResult[] = [];

        for (let i = start; i < data.length && i < max; i++) {
            const idMal = await this.anidb.idToMal(String(data[i].anidb.id), Type.ANIME);
            if (idMal) {
                result.push({
                    idMal: idMal,
                    day: data[i].day,
                    datetime: data[i].datetime
                });
            }
        }
        return result;
    }
}

interface ScheduleResult {
    idMal: string;
    day: string;
    datetime: string;
}

interface ScheduleResponse {
    anidb: {
        id: number;
        image: string;
        title: string;
        slug: string;
        my: {
            popularity: number;
            ranked: number;
            rating: number;
        };
        at_torrents: [{
            id: number;
        }];
    };
    anidb_episode: {
        episode: string;
        main_title: string;
        video_files: [any]
    };
    day: string;
    datetime: string;
}