export var config = {
    encryptionKey: "AniSync",
    mapping: {
        threshold: 0.8,
        comparison_threshold: 0.8,
        check_genres: false,
        anime: {
            CrunchyRoll: {
                threshold: 0.8,
                comparison_threshold: 0.8,
                email: "",
                password: "",
                locale: "en-US"
            },
            ZoroTo: {
                threshold: 0.8,
                comparison_threshold: 0.8
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