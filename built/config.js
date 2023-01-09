"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.config = {
    encryptionKey: "AniSync",
    mapping: {
        threshold: 0.8,
        comparison_threshold: 0.8,
        wait: 200,
        check_genres: false,
        anime: {
            CrunchyRoll: {
                threshold: 0.95,
                comparison_threshold: 0.95,
                wait: 500,
                email: "alexayalavazquez@hotmail.com",
                password: "Alejandrito0",
                locale: "en-US"
            },
            Zoro: {
                threshold: 0.95,
                comparison_threshold: 0.95,
                wait: 200
            }
        },
        anilist: {
            SEASON: "WINTER",
            SEASON_YEAR: 2023,
            NEXT_SEASON: "SPRING",
            NEXT_YEAR: 2023
        }
    }
};
//# sourceMappingURL=config.js.map