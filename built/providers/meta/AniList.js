"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Genres = exports.Sort = exports.Format = void 0;
const config_1 = require("../../config");
const API_1 = require("../../API");
class AniList extends API_1.default {
    constructor(id, type, format, isMal) {
        super(API_1.ProviderType.META);
        this.api = "https://graphql.anilist.co";
        this.id = undefined;
        this.type = undefined;
        this.format = undefined;
        this.isMal = false;
        this.config = config_1.config.mapping.provider.AniList;
        this.query = `
    id
    idMal
    title {
        romaji
        english
        native
    }
    coverImage {
        extraLarge
        large
    }
    bannerImage
    startDate {
        year
        month
        day
    }
    endDate {
        year
        month
        day
    }
    description
    season
    seasonYear
    type
    format
    status(version: 2)
    episodes
    duration
    chapters
    volumes
    genres
    synonyms
    source(version: 3)
    isAdult
    meanScore
    averageScore
    popularity
    favourites
    countryOfOrigin
    isLicensed
    airingSchedule {
        edges {
            id
            node{
                id
                airingAt
                timeUntilAiring
                episode
                mediaId
            }
        }
    }
    relations {
        edges {
            id
            relationType(version: 2)
            node {
                id
                title {
                    userPreferred
                }
                format
                type
                status(version: 2)
                bannerImage
                coverImage {
                    large
                }
            }
        }
    }
    characterPreview: characters(perPage: 6, sort: [ROLE, RELEVANCE, ID]) {
        edges {
            id
            role
            name
            voiceActors(language: JAPANESE, sort: [RELEVANCE, ID]) {
                id
                name {
                    userPreferred
                }
                language: languageV2
                image {
                    large
                }
            }
            node {
                id
                name {
                    userPreferred
                }
                image {
                    large
                }
            }
        }
    }
    studios {
        edges {
            isMain
            node {
                id
                name
            }
        }
    }
    streamingEpisodes {
        title
        thumbnail
        url
    }
    trailer {
        id
        site
    }
    tags {
        id
        name
    }
    stats {
        statusDistribution {
            status
            amount
        }
        scoreDistribution {
            score
            amount
        }
    }
    `;
        this.id = this.parseURL(id);
        this.isMal = isMal;
        this.type = type ? type : "ANIME";
        this.format = format ? format : Format.TV;
    }
    parseURL(id) {
        id = id ? id : this.id;
        if (!id) {
            return undefined;
        }
        if (id.includes("anilist.co")) {
            return id.split("https://anilist.co/")[1].split("/")[1];
        }
        else {
            return id;
        }
    }
    async search(query, page, perPage, type, format, sort) {
        page = page ? page : 0;
        perPage = perPage ? perPage : 18;
        type = type ? type : this.type;
        format = format ? format : this.format;
        sort = sort ? sort : Sort.POPULARITY_DESC;
        this.format = format;
        if (!this.type || !this.format) {
            throw new Error("No format/type provided.");
        }
        const aniListArgs = {
            query: `
            query($page: Int, $perPage: Int, $search: String, $type: MediaType, $sort: [MediaSort], $format: MediaFormat) {
                Page(page: $page, perPage: $perPage) {
                    pageInfo {
                        total
                        currentPage
                        lastPage
                        hasNextPage
                        perPage
                    }
                    media(type: $type, search: $search, sort: $sort, format: $format) {
                        ${this.query}
                    }
                }
            }
            `,
            variables: {
                search: query,
                page: page,
                perPage: perPage,
                type: type,
                format: format,
                sort: sort
            }
        };
        try {
            const req = await this.fetch(this.api, {
                body: JSON.stringify(aniListArgs),
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                }
            });
            const data = req.json();
            if (!data || !data.data || !data.data.Page.pageInfo || !data.data.Page.media) {
                throw new Error(req.text());
            }
            return data;
        }
        catch (e) {
            throw new Error(e.message);
        }
    }
    async searchGenres(included, excluded, page, perPage, type, format, sort) {
        included = included ? included : [];
        excluded = excluded ? excluded : [];
        page = page ? page : 0;
        perPage = perPage ? perPage : 18;
        type = type ? type : this.type;
        format = format ? format : this.format;
        sort = sort ? sort : Sort.POPULARITY_DESC;
        this.format = format;
        const aniListArgs = {
            query: `
            query($page: Int, $perPage: Int, $type: MediaType, $format: [MediaFormat], $genres: [String], $excludedGenres: [String], $sort: [MediaSort]) {
                Page(page: $page, perPage: $perPage) {
                    pageInfo {
                        total
                        currentPage
                        lastPage
                        hasNextPage
                        perPage
                    }
                    media(type: $type, format_in: $format, genre_in: $genres, genre_not_in: $excludedGenres, sort: $sort) {
                        ${this.query}
                    }
                }
            }
            `,
            variables: {
                page: page,
                perPage: perPage,
                type: type,
                format: format,
                sort: sort,
                genres: included,
                excludedGenres: excluded
            }
        };
        try {
            const req = await this.fetch(this.api, {
                body: JSON.stringify(aniListArgs),
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                }
            });
            const data = req.json();
            if (!data || !data.data || !data.data.Page.pageInfo || !data.data.Page.media) {
                throw new Error(req.text());
            }
            return data;
        }
        catch (e) {
            throw new Error(e.message);
        }
    }
    async malToAniList(id, type, wait) {
        if (!this.isMal) {
            id = id ? id : this.id;
            type = type ? type : this.type;
        }
        else {
            id = this.id;
            type = type ? type : this.type;
        }
        if (!type || !id) {
            throw new Error("No format or id provided.");
        }
        const aniListArgs = {
            query: `
            query ($id: Int, $format: MediaType) {
                Media(idMal: $id, type: $format) {
                    id
                    idMal
                }
            }
            `,
            variables: { "id": id, "format": type }
        };
        if (wait) {
            await this.wait(wait);
        }
        try {
            const req = await this.fetch(this.api, {
                body: JSON.stringify(aniListArgs),
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                }
            });
            const data = req.json();
            if (!data || !data.data || !data.data.Media.id) {
                throw new Error(req.text());
            }
            this.id = data.data.Media.id;
            this.type = type;
            return data.data.Media.id;
        }
        catch (e) {
            throw new Error(e.message);
        }
    }
    async getInfo(wait) {
        let aniListArgs;
        if (!this.format || !this.id) {
            throw new Error("No format or id provided.");
        }
        if (this.isMal) {
            aniListArgs = {
                query: `
                query($id: Int, $format: MediaType) {
                    Media(idMal: $id, type: $format) {
                        ${this.query}
                    }
                }
                `,
                variables: { "id": this.id, "format": this.format }
            };
        }
        else {
            aniListArgs = {
                query: `
                query($id: Int) {
                    Media(idMal: $id) {
                        ${this.query}
                    }
                }
                `,
                variables: { "id": this.id }
            };
        }
        if (wait) {
            await this.wait(wait);
        }
        try {
            const req = await this.fetch(this.api, {
                body: JSON.stringify(aniListArgs),
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                }
            });
            if (!req) {
                throw new Error("Request failed.");
            }
            const data = req.json();
            if (!data || !data.data || !data.data.Media.id) {
                throw new Error(req.text());
            }
            return data;
        }
        catch (e) {
            throw new Error(e.message);
        }
    }
    updateId(id) {
        this.id = id;
    }
    updateType(type) {
        this.type = type;
    }
    updateMal(isMal) {
        this.isMal = isMal;
    }
    async getSeasonal(page, perPage, type) {
        page = page ? page : 0;
        perPage = perPage ? perPage : 6;
        type = type ? type : this.type;
        if (!type) {
            throw new Error("No type specified.");
        }
        const aniListArgs = {
            query: `
            query($season: MediaSeason, $seasonYear: Int, $nextSeason: MediaSeason, $nextYear: Int) {
                trending: Page(page: ${page}, perPage: ${perPage}) {
                    media(sort: TRENDING_DESC, type: ${type}, isAdult: false) {
                        ...media
                    }
                }
                season: Page(page: ${page}, perPage: ${perPage}) {
                    media(season: $season, seasonYear: $seasonYear, sort: POPULARITY_DESC, type: ${type}, isAdult: false) {
                        ...media
                    }
                }
                nextSeason: Page(page: ${page}, perPage: ${perPage}) {
                    media(season: $nextSeason, seasonYear: $nextYear, sort: POPULARITY_DESC, type: ${type}, isAdult: false) {
                        ...media
                    }
                }
                popular: Page(page: ${page}, perPage: ${perPage}) {
                    media(sort: POPULARITY_DESC, type: ${type}, isAdult: false) {
                        ...media
                    }
                }
                top: Page(page: ${page}, perPage: ${perPage}) {
                    media(sort: SCORE_DESC, type: ${type}, isAdult: false) {
                        ...media
                    }
                }
            }
            
            fragment media on Media {
                ${this.query}
            }
            `,
            variables: {
                "type": type,
                "season": this.config.SEASON,
                "seasonYear": this.config.SEASON_YEAR,
                "nextSeason": this.config.NEXT_SEASON,
                "nextYear": this.config.NEXT_YEAR
            }
        };
        try {
            const req = await this.fetch(this.api, {
                body: JSON.stringify(aniListArgs),
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                }
            });
            const data = req.json();
            if (!data || !data.data) {
                throw new Error(req.text());
            }
            return data;
        }
        catch (e) {
            throw new Error(e.message);
        }
    }
}
exports.default = AniList;
var Format;
(function (Format) {
    Format["TV"] = "TV";
    Format["TV_SHORT"] = "TV_SHORT";
    Format["MOVIE"] = "MOVIE";
    Format["SPECIAL"] = "SPECIAL";
    Format["OVA"] = "OVA";
    Format["ONA"] = "ONA";
    Format["MUSIC"] = "MUSIC";
    Format["MANGA"] = "MANGA";
    Format["NOVEL"] = "NOVEL";
    Format["ONE_SHOT"] = "ONE_SHOT";
})(Format = exports.Format || (exports.Format = {}));
var Sort;
(function (Sort) {
    Sort["ID"] = "ID";
    Sort["ID_DESC"] = "ID_DESC";
    Sort["TITLE_ROMAJI"] = "TITLE_ROMAJI";
    Sort["TITLE_ROMAJI_DESC"] = "TITLE_ROMAJI_DESC";
    Sort["TYPE"] = "TYPE";
    Sort["FORMAT"] = "FORMAT";
    Sort["FORMAT_DESC"] = "FORMAT_DESC";
    Sort["SCORE"] = "SCORE";
    Sort["SCORE_DESC"] = "SCORE_DESC";
    Sort["POPULARITY"] = "POPULARITY";
    Sort["POPULARITY_DESC"] = "POPULARITY_DESC";
    Sort["TRENDING"] = "TRENDING";
    Sort["TRENDING_DESC"] = "TRENDING_DESC";
    Sort["CHAPTERS"] = "CHAPTERS";
    Sort["CHAPTERS_DESC"] = "CHAPTERS_DESC";
    Sort["VOLUMES"] = "VOLUMES";
    Sort["UPDATED_AT"] = "UPDATED_AT";
    Sort["UPDATED_AT_DESC"] = "UPDATED_AT_DESC";
})(Sort = exports.Sort || (exports.Sort = {}));
var Genres;
(function (Genres) {
    Genres["ACTION"] = "Action";
    Genres["ADVENTURE"] = "Adventure";
    Genres["COMEDY"] = "Comedy";
    Genres["DRAMA"] = "Drama";
    Genres["ECCHI"] = "Ecchi";
    Genres["FANTASY"] = "Fantasy";
    Genres["HORROR"] = "Horror";
    Genres["MAHOU_SHOUJO"] = "Mahou Shoujo";
    Genres["MECHA"] = "Mecha";
    Genres["MUSIC"] = "Music";
    Genres["MYSTERY"] = "Mystery";
    Genres["PSYCHOLOGICAL"] = "Psychological";
    Genres["ROMANCE"] = "Romance";
    Genres["SCI_FI"] = "Sci-Fi";
    Genres["SLICE_OF_LIFE"] = "Slice of Life";
    Genres["SPORTS"] = "Sports";
    Genres["SUPERNATURAL"] = "Supernatural";
    Genres["THRILLER"] = "Thriller";
})(Genres = exports.Genres || (exports.Genres = {}));
;
//# sourceMappingURL=AniList.js.map