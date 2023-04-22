import { ProviderType } from "../types/API";
import Provider from "../types/Provider";
import { Result } from "../Core";

export default class AniSkip extends Provider {
    private api = "https://api.aniskip.com/v2";

    constructor() {
        super("https://aniskip.com", ProviderType.META, [], "AniSkip");
    }

    public async search(query:string): Promise<Array<Result>> {
        return [];
    }

    /**
     * @description Different from other providers. Retrieves the skip times for a given AniList ID
     * @param id AniList ID
     * @param episodeNumber Episode number
     * @param episodeLength Episode length in seconds
     * @returns Promise<SkipTimes>
     */
    // Example:
    // aniSkip.getTimes("21", "1", [SkipTypes.OP, SkipTypes.ED]).then(console.log)
    public async getTimes(idMal:string, episodeNumber:number, types:SkipTypes[] = [SkipTypes.OP], episodeLength:number = 0): Promise<SkipTimes> {
        let typesString = "";
        if (types.length > 1) {
            types.forEach(type => {
                typesString += type + "&types=";
            });
            // Remove the last "&types="
            typesString = typesString.substring(0, typesString.length - 7);
        } else {
            typesString = SkipTypes.OP;
        }
        const req = await this.fetch(`${this.api}/skip-times/${idMal}/${episodeNumber}?types=${typesString}&episodeLength=${episodeLength}`);
        const data:SkipTimes = req.json();
        return data;
    }
}

export enum SkipTypes {
    OP = "op",
    ED = "ed",
    MIXED_OP = "mixed-op",
    MIXED_ED = "mixed-ed",
    RECAP = "recap"
}

interface SkipTimes {
    found: boolean;
    results: SkipResult[];
    message: string;
    statusCode: number;
}

interface SkipResult {
    interval: {
        startTime: number;
        endTime: number;
    };
    skipType: SkipTypes;
    skipId: string;
    episodeLength: number;
}