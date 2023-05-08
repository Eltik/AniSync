"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Formats = exports.META_PROVIDERS = exports.INFORMATION_PROVIDERS = exports.MANGA_PROVIDERS = exports.ANIME_PROVIDERS = void 0;
const _9anime_1 = __importDefault(require("./impl/anime/9anime"));
const anilist_1 = __importDefault(require("./impl/information/anilist"));
const comicK_1 = __importDefault(require("./impl/manga/comicK"));
const mal_1 = __importDefault(require("./impl/information/mal"));
const kitsu_1 = __importDefault(require("./impl/information/kitsu"));
const kitsuanime_1 = __importDefault(require("./impl/meta/kitsuanime"));
const kitsumanga_1 = __importDefault(require("./impl/meta/kitsumanga"));
const gogoanime_1 = __importDefault(require("./impl/anime/gogoanime"));
const zoro_1 = __importDefault(require("./impl/anime/zoro"));
const animepahe_1 = __importDefault(require("./impl/anime/animepahe"));
const mangadex_1 = __importDefault(require("./impl/manga/mangadex"));
const mangasee_1 = __importDefault(require("./impl/manga/mangasee"));
const novelbuddy_1 = __importDefault(require("./impl/manga/novelbuddy"));
const novelupdates_1 = __importDefault(require("./impl/manga/novelupdates"));
const tmdb_1 = __importDefault(require("./impl/meta/tmdb"));
const batoto_1 = __importDefault(require("./impl/manga/batoto"));
const jnovels_1 = __importDefault(require("./impl/manga/jnovels"));
const readlightnovels_1 = __importDefault(require("./impl/manga/readlightnovels"));
const ANIME_PROVIDERS = [new _9anime_1.default(), new gogoanime_1.default(), new zoro_1.default(), new animepahe_1.default()];
exports.ANIME_PROVIDERS = ANIME_PROVIDERS;
const MANGA_PROVIDERS = [new batoto_1.default(), new comicK_1.default(), new mangadex_1.default(), new mangasee_1.default(), new novelbuddy_1.default(), new novelupdates_1.default(), new jnovels_1.default(), new readlightnovels_1.default()];
exports.MANGA_PROVIDERS = MANGA_PROVIDERS;
const INFORMATION_PROVIDERS = [new anilist_1.default(), new mal_1.default(), new kitsu_1.default()];
exports.INFORMATION_PROVIDERS = INFORMATION_PROVIDERS;
const META_PROVIDERS = [new kitsuanime_1.default(), new kitsumanga_1.default(), new tmdb_1.default()];
exports.META_PROVIDERS = META_PROVIDERS;
exports.Formats = [
    "TV" /* Format.TV */,
    "TV_SHORT" /* Format.TV_SHORT */,
    "MOVIE" /* Format.MOVIE */,
    "SPECIAL" /* Format.SPECIAL */,
    "OVA" /* Format.OVA */,
    "ONA" /* Format.ONA */,
    "MUSIC" /* Format.MUSIC */,
    "MANGA" /* Format.MANGA */,
    "NOVEL" /* Format.NOVEL */,
    "ONE_SHOT" /* Format.ONE_SHOT */,
    "UNKNOWN" /* Format.UNKNOWN */
];
