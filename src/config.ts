export var config = {
    web_server: {
        port: 3000,
        cors: ["*"],
    },
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
                locale: "en-US",
                disabled: false
            },
            Zoro: {
                threshold: 0.95,
                comparison_threshold: 0.95,
                wait: 200,
                disabled: false
            },
            GogoAnime: {
                threshold: 0.6,
                comparison_threshold: 0.6,
                wait: 200,
                disabled: false
            },
            AnimeFox: {
                threshold: 0.65,
                comparison_threshold: 0.65,
                wait: 200,
                disabled: false
            },
            AnimePahe: {
                threshold: 0.7,
                comparison_threshold: 0.7,
                wait: 200,
                disabled: false
            },
            Enime: {
                threshold: 0.95,
                comparison_threshold: 0.95,
                wait: 400,
                disabled: false
            },
            ComicK: {
                threshold: 0.8,
                comparison_threshold: 0.8,
                wait: 200,
                disabled: false
            },
            MangaDex: {
                threshold: 0.8,
                comparison_threshold: 0.8,
                wait: 200,
                disabled: false
            },
            Mangakakalot: {
                threshold: 0.8,
                comparison_threshold: 0.8,
                wait: 200,
                disabled: false
            },
            TMDB: {
                api_key: "5201b54eb0968700e693a30576d7d4dc",
                threshold: 0.6,
                comparison_threshold: 0.6,
                wait: 350,
                disabled: false
            },
            AniList: {
                SEASON: "WINTER",
                SEASON_YEAR: 2023,
                NEXT_SEASON: "SPRING",
                NEXT_YEAR: 2023,
                disabled: false
            }
        },
    },
    crawling: {
        debug: true,
        anime: {
            wait: 1000,
            max_pages: 15,
            start: 0
        }
    }
};