import InformationProvider, { AnimeInfo, MangaInfo } from ".";
import { Anime, Manga } from "../..";
export default class MAL extends InformationProvider {
    id: string;
    url: string;
    private statusMap;
    get priorityArea(): (keyof AnimeInfo | MangaInfo)[];
    get sharedArea(): (keyof AnimeInfo | MangaInfo)[];
    info(media: Anime | Manga): Promise<AnimeInfo | MangaInfo | undefined>;
}
