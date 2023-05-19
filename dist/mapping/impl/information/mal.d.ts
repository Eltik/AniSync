import InformationProvider, { AnimeInfo, MangaInfo, MediaInfoKeys } from ".";
import { Anime, Manga } from "../..";
export default class MAL extends InformationProvider<Anime | Manga, AnimeInfo | MangaInfo> {
    id: string;
    url: string;
    private statusMap;
    get priorityArea(): MediaInfoKeys[];
    get sharedArea(): MediaInfoKeys[];
    info(media: Anime | Manga): Promise<AnimeInfo | MangaInfo | undefined>;
}
