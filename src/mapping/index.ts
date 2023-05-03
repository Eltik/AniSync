import AnimeProvider from "./impl/anime";
import NineAnime from "./impl/anime/9anime";
import InformationProvider from "./impl/information";
import AniList from "./impl/information/anilist";
import MangaProvider from "./impl/manga";
import ComicK from "./impl/manga/comicK";
import MAL from "./impl/information/mal";
import Kitsu from "./impl/information/kitsu";
import KitsuAnime from "./impl/meta/kitsuanime";
import KitsuManga from "./impl/meta/kitsumanga";
import GogoAnime from "./impl/anime/gogoanime";
import Zoro from "./impl/anime/zoro";
import AnimePahe from "./impl/anime/animepahe";
import MangaDex from "./impl/manga/mangadex";
import MangaSee from "./impl/manga/mangasee";
import MetaProvider from "./impl/meta";
import NovelBuddy from "./impl/manga/novelbuddy";
import NovelUpdates from "./impl/manga/novelupdates";
import TMDB from "./impl/meta/tmdb";
import BatoTo from "./impl/manga/batoto";

const ANIME_PROVIDERS: AnimeProvider[] = [new NineAnime(), new GogoAnime(), new Zoro(), new AnimePahe()];
const MANGA_PROVIDERS: MangaProvider[] = [new BatoTo(), new ComicK(), new MangaDex(), new MangaSee(), new NovelBuddy(), new NovelUpdates()];
const INFORMATION_PROVIDERS: InformationProvider[] = [new AniList(), new MAL(), new Kitsu()];
const META_PROVIDERS: MetaProvider[] = [new KitsuAnime(), new KitsuManga(), new TMDB()];

export {
    ANIME_PROVIDERS,
    MANGA_PROVIDERS,
    INFORMATION_PROVIDERS,
    META_PROVIDERS
}

export type Result = {
    id: string,
    title: string,
    altTitles: string[],
    year: number,
    img: string | null,
    providerId: string
}

export const enum Type {
    ANIME = "ANIME",
    MANGA = "MANGA"
}

export const enum Format {
    TV = "TV",
    TV_SHORT = "TV_SHORT",
    MOVIE = "MOVIE",
    SPECIAL = "SPECIAL",
    OVA = "OVA",
    ONA = "ONA",
    MUSIC = "MUSIC",
    MANGA = "MANGA",
    NOVEL = "NOVEL",
    ONE_SHOT = "ONE_SHOT",
    UNKNOWN = "UNKNOWN"
}

export const enum Season {
    WINTER = "WINTER",
    SPRING = "SPRING",
    SUMMER = "SUMMER",
    FALL = "FALL",
    UNKNOWN = "UNKNOWN"
}

export const enum MediaStatus {
    FINISHED = "FINISHED",
    RELEASING = "RELEASING",
    NOT_YET_RELEASED = "NOT_YET_RELEASED",
    CANCELLED = "CANCELLED",
    HIATUS = "HIATUS"
}

export const enum Genres {
    ACTION = "Action",
    ADVENTURE = "Adventure",
    COMEDY = "Comedy",
    DRAMA = "Drama",
    ECCHI = "Ecchi",
    FANTASY = "Fantasy",
    HORROR = "Horror",
    MAHOU_SHOUJO = "Mahou Shoujo",
    MECHA = "Mecha",
    MUSIC = "Music",
    MYSTERY = "Mystery",
    PSYCHOLOGICAL = "Psychological",
    ROMANCE = "Romance",
    SCI_FI = "Sci-Fi",
    SLICE_OF_LIFE = "Slice of Life",
    SPORTS = "Sports",
    SUPERNATURAL = "Supernatural",
    THRILLER = "Thriller"
}

export type Anime = {
    id: string;
    malId: string;
    kitsuId: string | null;
    slug: string;
    coverImage: string | null;
    bannerImage: string | null;
    trailer: string | null;
    status: MediaStatus | null;
    season: Season;
    title: {
        romaji: string | null;
        english: string | null;
        native: string | null;
    };
    currentEpisode: number | null;
    mappings: { id: string, providerId: string, similarity: number }[];
    synonyms: string[];
    countryOfOrigin: string | null;
    description: string | null;
    duration: number | null;
    color: string | null;
    year: number | null;
    rating: {
        anilist: number;
        mal: number;
        kitsu: number;
    };
    popularity: {
        anilist: number;
        mal: number;
        kitsu: number;
    };
    type: Type;
    genres: Genres[];
    format: Format;
    relations: any[];
    totalEpisodes?: number;
    tags: string[];
}

export type Manga = {
    id: string;
    malId: string;
    kitsuId: string | null;
    slug: string;
    coverImage: string | null;
    bannerImage: string | null;
    status: MediaStatus | null;
    title: {
        romaji: string | null;
        english: string | null;
        native: string | null;
    };
    mappings: { id: string, providerId: string, similarity: number }[];
    synonyms: string[];
    countryOfOrigin: string | null;
    description: string | null;
    totalVolumes: number | null;
    color: string | null;
    rating: {
        anilist: number;
        mal: number;
        kitsu: number;
    };
    popularity: {
        anilist: number;
        mal: number;
        kitsu: number;
    };
    genres: Genres[];
    type: Type;
    format: Format;
    relations: any[];
    totalChapters: number | null;
    tags: string[];
}