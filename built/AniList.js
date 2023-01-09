"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const API_1 = require("./API");
class AniList extends API_1.default {
    constructor(id, type, format, isMal) {
        super();
        this.api = "https://graphql.anilist.co";
        this.id = undefined;
        this.type = undefined;
        this.format = undefined;
        this.isMal = false;
        this.config = config_1.config.mapping.anilist;
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
    hashtag
    countryOfOrigin
    isLicensed
    nextAiringEpisode {
        airingAt
        timeUntilAiring
        episode
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
        this.format = format ? format : "TV";
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
        sort = sort ? sort : "POPULARITY_DESC";
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
            const req = await this.fetchJSON(this.api, {
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
            const req = await this.fetchJSON(this.api, {
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
            const req = await this.fetchJSON(this.api, {
                body: JSON.stringify(aniListArgs),
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                }
            });
            if (!req) {
                console.log(req);
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
                    media(sort: TRENDING_DESC, type: ANIME, isAdult: false) {
                        ...media
                    }
                }
                season: Page(page: ${page}, perPage: ${perPage}) {
                    media(season: $season, seasonYear: $seasonYear, sort: POPULARITY_DESC, type: ANIME, isAdult: false) {
                        ...media
                    }
                }
                nextSeason: Page(page: ${page}, perPage: ${perPage}) {
                    media(season: $nextSeason, seasonYear: $nextYear, sort: POPULARITY_DESC, type: ANIME, isAdult: false) {
                        ...media
                    }
                }
                popular: Page(page: ${page}, perPage: ${perPage}) {
                    media(sort: POPULARITY_DESC, type: ANIME, isAdult: false) {
                        ...media
                    }
                }
                top: Page(page: ${page}, perPage: ${perPage}) {
                    media(sort: SCORE_DESC, type: ANIME, isAdult: false) {
                        ...media
                    }
                }
            }
            
            fragment media on Media {
                ${this.query}
            }
            `,
            variables: {
                "type": this.type,
                "season": this.config.SEASON,
                "seasonYear": this.config.SEASON_YEAR,
                "nextSeason": this.config.NEXT_SEASON,
                "nextYear": this.config.NEXT_YEAR
            }
        };
        try {
            const req = await this.fetchJSON(this.api, {
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
;
//# sourceMappingURL=AniList.js.map