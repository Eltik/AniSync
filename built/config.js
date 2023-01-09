"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.config = {
    mapping: {
        threshold: 0.8,
        comparison_threshold: 0.8,
        wait: 200,
        check_genres: false,
        provider: {
            CrunchyRoll: {
                threshold: 0.95,
                comparison_threshold: 0.95,
                wait: 500,
                email: "",
                password: "",
                locale: "en-US"
            },
            Zoro: {
                threshold: 0.95,
                comparison_threshold: 0.95,
                wait: 200
            },
            GogoAnime: {
                threshold: 0.95,
                comparison_threshold: 0.95,
                wait: 200
            },
            ComicK: {
                threshold: 0.8,
                comparison_threshold: 0.8,
                wait: 200
            },
            MangaDex: {
                threshold: 0.8,
                comparison_threshold: 0.8,
                wait: 200
            },
            Mangakakalot: {
                threshold: 0.8,
                comparison_threshold: 0.8,
                wait: 200
            },
            TMDB: {
                api_key: "5201b54eb0968700e693a30576d7d4dc",
                threshold: 0.95,
                comparison_threshold: 0.95,
                wait: 350
            },
            AniList: {
                SEASON: "WINTER",
                SEASON_YEAR: 2023,
                NEXT_SEASON: "SPRING",
                NEXT_YEAR: 2023
            }
        },
    },
    crawling: {
        debug: true,
        anime: {
            wait: 1000,
            max_pages: 5
        }
    }
};
//# sourceMappingURL=config.js.map