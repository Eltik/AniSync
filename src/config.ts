export var config = {
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
                email: "",
                password: "",
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
    },
    crawling: {
        debug: true,
        anime: {
            wait: 1000,
            maxPages: 5
        }
    }
};