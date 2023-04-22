import { ProviderType } from "../types/API";
import Provider from "../types/Provider";
import { Options, Response } from "../libraries/promise-request";
import colors from "colors";

export default class AniList extends Provider {
    // Use a custom URL for the API
    private api: string = "https://graphql.anilist.co";

    public id:string = undefined;
    public type:Type = undefined;

    private query:string = `
    id
    idMal
    title {
        romaji
        english
        native
        userPreferred
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
            node {
                airingAt
                timeUntilAiring
                episode
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
    `;

    constructor() {
        super("https://anilist.co", ProviderType.META, [], "AniList");
    }

    /**
     * @description Searches on AniList for media
     * @param query Media to search for
     * @param type The type of media to search for
     * @param page Page to start searching
     * @param perPage Amount of media per page
     * @returns Promise<Media[]>
     */
    public async search(query:string, type:Type, page?:number, perPage?:number): Promise<Media[]> {
        page = page ? page : 0;
        perPage = perPage ? perPage : 10;
        const aniListArgs = {
            query: `
            query($page: Int, $perPage: Int, $search: String, $type: MediaType) {
                Page(page: $page, perPage: $perPage) {
                    pageInfo {
                        total
                        currentPage
                        lastPage
                        hasNextPage
                        perPage
                    }
                    media(type: $type, search: $search) {
                        ${this.query}
                    }
                }
            }
            `,
            variables: {
                search: query,
                type: type,
                page: page,
                perPage: perPage
            }
        }
        const req = await this.request(this.api, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(aniListArgs)
        });
        if (!req) {
            return null;
        }
        const data = req.json()
        return data.data.Page.media;
    }

    /**
     * @description Searches on AniList for media
     * @param query Media to search for
     * @param type The type of media to search for
     * @param page Page to start searching
     * @param perPage Amount of media per page
     * @returns Promise<Media[]>
     */
    public async searchFormat(query:string, type:Type, format:Format[], page?:number, perPage?:number): Promise<Media[]> {
        page = page ? page : 0;
        perPage = perPage ? perPage : 10;
        format = format ? format : (type == Type.ANIME ? [Format.TV, Format.TV_SHORT, Format.MOVIE, Format.SPECIAL, Format.OVA, Format.ONA] : [Format.MANGA, Format.NOVEL, Format.ONE_SHOT]);
        const aniListArgs = {
            query: `
            query($page: Int, $perPage: Int, $search: String, $type: MediaType, $format: [MediaFormat]) {
                Page(page: $page, perPage: $perPage) {
                    pageInfo {
                        total
                        currentPage
                        lastPage
                        hasNextPage
                        perPage
                    }
                    media(type: $type, format_in: $format, search: $search) {
                        ${this.query}
                    }
                }
            }
            `,
            variables: {
                search: query,
                type: type,
                format: format,
                page: page,
                perPage: perPage
            }
        }
        const req = await this.request(this.api, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(aniListArgs)
        });
        if (!req) {
            return null;
        }
        let data;
        try {
            data = req.json()
        } catch (e) {
            console.log(colors.red("There was an error searching AniList by format."))
        }
        
        if (!data) {
            return [];
        }
        return data.data.Page.media;
    }

    /**
     * @description Sends a request to AniList and fetches information about the media
     * @param id AniList ID
     * @returns Promise<Media>
     */
    public async getMedia(id:string): Promise<Media> {
        const query = `query ($id: Int) {
            Media (id: $id) {
                ${this.query}
            }
        }`;
        const variables = {
            id: parseInt(id)
        };

        if (isNaN(variables.id)) {
            return null;
        }
        const req = await this.request(this.api, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                query,
                variables
            })
        });
        if (!req) {
            return null;
        }
        const data = req.json()
        return data.data.Media;
    }

    /**
     * @description Fetches all anime AniList ID's from AniList's sitemap
     * @returns Promise<string[]>
     */
    public async getAnimeIDs(): Promise<string[]> {
        const req1 = await this.request("https://anilist.co/sitemap/anime-0.xml");
        const data1 = await req1.text();
        const req2 = await this.request("https://anilist.co/sitemap/anime-1.xml");
        const data2 = await req2.text();

        const ids1 = data1.match(/anime\/([0-9]+)/g).map((id) => {
            return id.replace("anime/", "");
        });

        const ids2 = data2.match(/anime\/([0-9]+)/g).map((id) => {
            return id.replace("anime/", "");
        });
        return ids1.concat(ids2);
    }

    /**
     * @description Fetches all manga AniList ID's from AniList's sitemap
     * @returns Promise<string[]>
     */
    public async getMangaIDs(): Promise<string[]> {
        const req1 = await this.fetch("https://anilist.co/sitemap/manga-0.xml");
        const data1 = await req1.text();
        const req2 = await this.fetch("https://anilist.co/sitemap/manga-1.xml");
        const data2 = await req2.text();

        const ids1 = data1.match(/manga\/([0-9]+)/g).map((id) => {
            return id.replace("manga/", "");
        });

        const ids2 = data2.match(/manga\/([0-9]+)/g).map((id) => {
            return id.replace("manga/", "");
        });
        return ids1.concat(ids2);
    }

    public async getSeasonal(type?:Type, format?:Format[], page?:number, perPage?:number): Promise<SeasonalResponse> {
        page = page ? page : 0;
        perPage = perPage ? perPage : 6;
        type = type ? type : Type.ANIME;
        format = format ? format : [Format.TV, Format.TV_SHORT, Format.MOVIE, Format.SPECIAL, Format.OVA, Format.ONA];

        if (!type) {
            throw new Error("No type specified.");
        }

        const aniListArgs = {
            query: `
            query($season: MediaSeason, $seasonYear: Int, $nextSeason: MediaSeason, $nextYear: Int, $format: [MediaFormat], $page: Int, $perPage: Int, $type: MediaType) {
                trending: Page(page: $page, perPage: $perPage) {
                    media(sort: TRENDING_DESC, type: $type, isAdult: false, format_in: $format) {
                        ...media
                    }
                }
                season: Page(page: $page, perPage: $perPage) {
                    media(season: $season, seasonYear: $seasonYear, sort: POPULARITY_DESC, type: $type, isAdult: false, format_in: $format) {
                        ...media
                    }
                }
                nextSeason: Page(page: $page, perPage: $perPage) {
                    media(season: $nextSeason, seasonYear: $nextYear, sort: POPULARITY_DESC, type: $type, isAdult: false, format_in: $format) {
                        ...media
                    }
                }
                popular: Page(page: $page, perPage: $perPage) {
                    media(sort: POPULARITY_DESC, type: $type, isAdult: false, format_in: $format) {
                        ...media
                    }
                }
                top: Page(page: $page, perPage: $perPage) {
                    media(sort: SCORE_DESC, type: $type, isAdult: false, format_in: $format) {
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
                "season": this.config.AniList.SEASON,
                "seasonYear": this.config.AniList.SEASON_YEAR,
                "nextSeason": this.config.AniList.NEXT_SEASON,
                "nextYear": this.config.AniList.NEXT_YEAR,
                "format": format,
                "page": page,
                "perPage": perPage
            }
        }

        try {
            const req = await this.request(this.api, {
                body: JSON.stringify(aniListArgs),
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                }
            });
            
            if (!req) {
                return null;
            }
            
            const data = req.json();
            if (!data || !data.data) {
                throw new Error(req.text());
            }
            return data;
        } catch (e) {
            throw new Error(e.message);
        }
    }

    /**s
     * @description Authenticates an user and returns an authentication token.
     * @param code Auth code
     * @returns Promise<AuthResponse>
     */
    public async auth(code:string): Promise<AuthResponse> {
        const options = {
            uri: 'https://anilist.co/api/v2/oauth/token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            json: {
                'grant_type': 'authorization_code',
                'client_id': this.config.AniList.oath_id,
                'client_secret': this.config.AniList.oath_secret,
                'redirect_uri': this.config.web_server.url + "/auth",
                'code': code,
            }
        };

        const req = await this.request(options.uri, {
            body: JSON.stringify(options.json),
            method: options.method,
            headers: options.headers
        }).catch((err) => {
            console.error(err);
            return null;
        });

        if (!req) {
            return null;
        }

        const data = req.json();
        return data;
    }

    /**
     * @description Fetches information about an user
     * @param username Username to query
     * @returns Promise<UserResponse>
     */
    public async getUser(username:string): Promise<UserResponse> {
        const options = {
            uri: this.api,
            method: 'POST',
            json: {
                query: `
                query($id: Int, $name: String) {
                    User(id: $id, name: $name) {
                        id name previousNames {
                            name updatedAt
                        }
                        avatar {
                            large
                        }
                        bannerImage about isFollowing isFollower donatorTier donatorBadge createdAt moderatorRoles isBlocked bans options {
                            profileColor restrictMessagesToFollowing
                        }
                        mediaListOptions {
                            scoreFormat
                        }
                        statistics {
                            anime {
                                count meanScore standardDeviation minutesWatched episodesWatched genrePreview: genres(limit: 10, sort: COUNT_DESC) {
                                    genre count
                                }
                            }
                            manga {
                                count meanScore standardDeviation chaptersRead volumesRead genrePreview: genres(limit: 10, sort: COUNT_DESC) {
                                    genre count
                                }
                            }
                        }
                        stats {
                            activityHistory {
                                date amount level
                            }
                        }
                        favourites {
                            anime {
                                edges {
                                    favouriteOrder node {
                                        id type status(version: 2) format isAdult bannerImage title {
                                            userPreferred
                                        }
                                        coverImage {
                                            large
                                        }
                                        startDate {
                                            year
                                        }
                                    }
                                }
                            }
                            manga {
                                edges {
                                    favouriteOrder node {
                                        id type status(version: 2) format isAdult bannerImage title {
                                            userPreferred
                                        }
                                        coverImage {
                                            large
                                        }
                                        startDate {
                                            year
                                        }
                                    }
                                }
                            }
                            characters {
                                edges {
                                    favouriteOrder node {
                                        id name {
                                            userPreferred
                                        }
                                        image {
                                            large
                                        }
                                    }
                                }
                            }
                            staff {
                                edges {
                                    favouriteOrder node {
                                        id name {
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
                                    favouriteOrder node {
                                        id name
                                    }
                                }
                            }
                        }
                    }
                }
                `,
                variables: {
                    "name": username,
                }
            }
        };

        const req = await this.request(options.uri, {
            body: JSON.stringify(options.json),
            method: options.method,
            headers: {
                "Content-Type": "application/json",
            }
        }).catch((err) => {
            console.error(err);
            return null;
        });

        if (!req) {
            return null;
        }

        const data = req.json();
        return data;
    }

    /**
     * @description Fetches the list of the currently logged-in user
     * @param token Authentication token
     * @returns Promise<UserResponse>
     */
    public async getViewer(token:string): Promise<UserResponse> {
        const options = {
            uri: this.api,
            method: 'POST',
            json: {
                query: `
                query {
                    Viewer {
                        id
                        name
                        previousNames {
                            name
                            updatedAt
                        }
                        avatar {
                            large
                        }
                        bannerImage
                        about
                        isFollowing
                        isFollower
                        donatorTier
                        donatorBadge
                        createdAt
                        moderatorRoles
                        isBlocked
                        bans
                        options {
                            profileColor
                            restrictMessagesToFollowing
                        }
                        mediaListOptions {
                            scoreFormat
                        }
                        statistics {
                            anime {
                                count
                                meanScore
                                standardDeviation
                                minutesWatched
                                episodesWatched
                                genrePreview: genres(limit: 10, sort: COUNT_DESC) {
                                    genre
                                    count
                                }
                            }
                            manga {
                                count
                                meanScore
                                standardDeviation
                                chaptersRead
                                volumesRead
                                genrePreview: genres(limit: 10, sort: COUNT_DESC) {
                                    genre
                                    count
                                }
                            }
                        }
                        stats {
                            activityHistory {
                                date
                                amount
                                level
                            }
                        }
                        favourites {
                            anime {
                                edges {
                                    favouriteOrder
                                    node {
                                        id
                                        type
                                        status(version: 2)
                                        format
                                        isAdult
                                        bannerImage
                                        title {
                                            userPreferred
                                        }
                                        coverImage {
                                            large
                                        }
                                        startDate {
                                            year
                                        }
                                    }
                                }
                            }
                            manga {
                                edges {
                                    favouriteOrder
                                    node {
                                        id
                                        type
                                        status(version: 2)
                                        format
                                        isAdult
                                        bannerImage
                                        title {
                                            userPreferred
                                        }
                                        coverImage {
                                            large
                                        }
                                        startDate {
                                            year
                                        }
                                    }
                                }
                            }
                            characters {
                                edges {
                                    favouriteOrder
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
                            staff {
                                edges {
                                    favouriteOrder
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
                                    favouriteOrder
                                    node {
                                        id
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
                `,
                variables: {
                }
            }
        };

        const req = await this.request(options.uri, {
            body: JSON.stringify(options.json),
            method: options.method,
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        }).catch((err) => {
            console.error(err);
            return null;
        });

        if (!req) {
            return null;
        }

        const data = req.json();
        return data;
    }

    /**
     * @description Gets the list of an user
     * @param userId The user ID to query
     * @param type Type of list to get (eg. anime/manga)
     * @returns Promise<ListResponse>
     */
    public async getList(userId:number, type?:Type):Promise<ListResponse> {
        type = type ? type : Type.ANIME;
        const aniListArgs = {
            query: `
                query($userId: Int, $userName: String, $type: MediaType) {
                MediaListCollection(userId: $userId, userName: $userName, type: $type) {
                    lists {
                        name isCustomList isCompletedList: isSplitCompletedList entries {
                            ...mediaListEntry
                        }
                    }
                    user {
                        id name avatar {
                            large
                        }
                        mediaListOptions {
                            scoreFormat rowOrder animeList {
                                sectionOrder customLists splitCompletedSectionByFormat theme
                            }
                            mangaList {
                                sectionOrder customLists splitCompletedSectionByFormat theme
                            }
                        }
                    }
                }
            }
            fragment mediaListEntry on MediaList {
                id mediaId status score progress progressVolumes repeat priority private hiddenFromStatusLists customLists advancedScores notes updatedAt startedAt {
                    year month day
                }
                completedAt {
                    year month day
                }
                media {
                    id title {
                        userPreferred romaji english native
                    }
                    coverImage {
                        extraLarge large
                    }
                    type format status(version: 2) episodes volumes chapters averageScore popularity isAdult countryOfOrigin genres bannerImage startDate {
                        year month day
                    }
                }
            }`,
            variables: {
                userId: userId,
                type: type
            }
        }

        const req = await this.request(this.api, {
            body: JSON.stringify(aniListArgs),
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
        }).catch((err) => {
            console.error(err);
            return null;
        });
        if (!req) {
            return null;
        }
        const data = req.json();
        return data;
    }

    /**
     * @description Updates the currently logged-in user's list
     * @param variables Controls the way a list is updated
     * @param token Authentication token
     * @returns Promise<UpdateResponse>
     */
    public async updateList(variables:ListVariables, token:string):Promise<UpdateResponse> {
        const aniListArgs = {
            query: `
            mutation($id: Int $mediaId: Int $status: MediaListStatus $score: Float $progress: Int $progressVolumes: Int $repeat: Int $private: Boolean $notes: String $customLists: [String] $hiddenFromStatusLists: Boolean $advancedScores: [Float] $startedAt: FuzzyDateInput $completedAt: FuzzyDateInput) {
                SaveMediaListEntry(id: $id mediaId: $mediaId status: $status score: $score progress: $progress progressVolumes: $progressVolumes repeat: $repeat private: $private notes: $notes customLists: $customLists hiddenFromStatusLists: $hiddenFromStatusLists advancedScores: $advancedScores startedAt: $startedAt completedAt: $completedAt) {
                    id mediaId status score advancedScores progress progressVolumes repeat priority private hiddenFromStatusLists customLists notes updatedAt startedAt {
                        year month day
                    }
                    completedAt {
                        year month day
                    }
                    user {
                        id name
                    }
                    media {
                        id title {
                            userPreferred
                        }
                        coverImage {
                            large
                        }
                        type format status episodes volumes chapters averageScore popularity isAdult startDate {
                            year
                        }
                    }
                }
            }
            `,
            variables: variables
        }
        const req = await this.request(this.api, {
            body: JSON.stringify(aniListArgs),
            method: "POST",
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        }).catch((err) => {
            console.error(err);
            return null;
        });
        if (!req) {
            return null;
        }
        const data = req.json();
        return data;
    }

    /**
     * @description Custom request function for handling AniList rate limit.
     */
    public async request(url: string, options?: Options, retries?:number): Promise<Response> {
        // Bypass rate limit via checking x-requests-remaining header
        const req = await this.fetch(url, options).then((data:any) => {
            const response = data.response ? data.response : data;

            if (response.headers["x-ratelimit-remaining"] || response.headers["x-ratelimit-limit"] || response.headers["x-ratelimit-reset"]) {
                const remainingRequests = Number.isNaN(parseInt(response.headers['x-ratelimit-remaining'])) ? 0 : parseInt(response.headers['x-ratelimit-remaining']);
                const requestLimit = Number.isNaN(parseInt(response.headers['x-ratelimit-limit'])) ? 0 : parseInt(response.headers['x-ratelimit-limit']);
    
                if (remainingRequests <= 60) {
                    const resetTime = new Date(parseInt(response.headers['x-ratelimit-reset']));
                    const delay = resetTime.getTime() - Date.now();
                    // Wait for the reset time
                    return new Promise(resolve => setTimeout(resolve, delay)).then((data) => {
                        return this.fetch(url, options)
                    });
                } else {
                    return data;
                }
            } else {
                // Use retry-after
                if (response.headers["retry-after"]) {
                    // Probably need to do an extra couple milliseconds.
                    const delay = parseInt(response.headers['retry-after']) * 3000;
                    return new Promise(resolve => setTimeout(resolve, delay)).then((data) => {
                        return this.fetch(url, options);
                    });
                } else {
                    if (retries > 5) return;

                    if (data && data.response && data.response.status && data.response.status === 429) {
                        console.log("No rate limit headers found. Waiting...")
                        return this.wait(1500).then(() => {
                            return this.request(url, options, retries ? retries + 1 : 0)
                        })
                    }

                    return data;
                }
            }
        });
        try {
            const data = req.json();
            const data2 = req.text();
            return req;
        } catch (e) {
            if (req.response?.headers) {
                if (req.response.headers["retry-after"]) {
                    // Probably need to do an extra couple milliseconds.
                    const delay = parseInt(req.response.headers['retry-after']) * 3000;
                    return new Promise(resolve => setTimeout(resolve, delay)).then((data) => {
                        return this.fetch(url, options);
                    });
                } else {
                    if (retries > 5) return;

                    if (req.response.status && req.response.status === 429) {
                        console.log("No rate limit headers found. Waiting...")
                        return this.wait(1500).then(() => {
                            return this.request(url, options, retries ? retries + 1 : 0)
                        })
                    }

                    return req;
                }
            } else {
                console.log("Could not find response.");
            }
            console.log("Can't parse JSON");
            return null;
        }
    }
}

export async function search(query:string, type:Type, page?:number, perPage?:number): Promise<Media[]> {
    const self = new AniList();
    return await self.search(query, type, page, perPage);
}

export async function getMedia(id:string): Promise<Media> {
    const self = new AniList();
    return await self.getMedia(id);
}

export async function getAnimeIDs(): Promise<string[]> {
    const self = new AniList();
    return await self.getAnimeIDs();
}

export async function getMangaIDs(): Promise<string[]> {
    const self = new AniList();
    return await self.getMangaIDs();
}

interface ListResponse {
    data: {
        MediaListCollection: {
            lists: [List];
            user: {
                id: number;
                name: string;
                avatar: {
                    large: string;
                };
                mediaListOptions: {
                    scoreFormat: string;
                    rowOrder: string;
                    animeList: {
                        sectionOrder: [string];
                        customLists: [string];
                        splitCompletedSectionByFormat: boolean;
                        theme: {
                            themeType: string;
                            theme: string;
                            coverImages: string;
                        };
                    };
                    mangaList: {
                        sectionOrder: [string];
                        customLists: [string];
                        splitCompletedSectionByFormat: boolean;
                        theme: {
                            themeType: string;
                            theme: string;
                            coverImages: string;
                        };
                    };
                };
            };
        };
    };
}

interface List {
    name: string;
    isCustomList: boolean;
    isCompleteList: boolean;
    entries: [ListEntry];
}

interface ListEntry {
    id: number;
    mediaId: number;
    status: string;
    score: number;
    progress: number;
    progressVolumes?: number;
    repeat: number;
    priority: number;
    private: boolean;
    hiddenFromStatusLists: boolean;
    customLists?: [string];
    advancedScores: {
        Story: number;
        Characters: number;
        Visuals: number;
        Audio: number;
        Enjoyment: number;
    };
    notes?: string;
    updatedAt: number;
    startedAt: {
        year?: number;
        month?: number;
        day?: number;
    };
    completedAt: {
        year?: number;
        month?: number;
        day?: number;
    };
    media: {
        id: number;
        title: Title;
        coverImage: {
            extraLarge: string;
            large: string;
        };
        type: Type;
        format: Format;
        status: string;
        episodes: number;
        volumes?: number;
        chapters?: number;
        averageScore: number;
        popularity: number;
        isAdult: boolean;
        countryOfOrigin: string;
        genres: [string];
        bannerImage: string;
        startDate: {
            year?: number;
            month?: number;
            day?: number;
        };
    }
}

interface UpdateResponse {
    data: {
        SaveMediaListEntry: ListVariables;
    }
}

interface ListVariables {
    id?: number;
    mediaId: number|string;
    progress?: number;
    progressVolumes?: number;
    score?: number;
    repeat?: number;
    priority?: number;
    private?: boolean;
    notes?: string;
    status?: Status;
    hiddenFromStatusLists?: boolean;
    customLists?: [string];
    advancedScored?: [number];
    startedAt?: number;
    completedAt?: number;
}

interface AuthResponse {
    token_type: string;
    expires_in: number;
    access_token: string;
}

export enum Type {
    ANIME = "ANIME",
    MANGA = "MANGA"
}

export enum Format {
    TV = "TV",
    TV_SHORT = "TV_SHORT",
    MOVIE = "MOVIE",
    SPECIAL = "SPECIAL",
    OVA = "OVA",
    ONA = "ONA",
    MUSIC = "MUSIC",
    MANGA = "MANGA",
    NOVEL = "NOVEL",
    ONE_SHOT = "ONE_SHOT"
}

export enum Sort {
    ID = "ID",
    ID_DESC = "ID_DESC",
    TITLE_ROMAJI = "TITLE_ROMAJI",
    TITLE_ROMAJI_DESC = "TITLE_ROMAJI_DESC",
    TYPE = "TYPE",
    FORMAT = "FORMAT",
    FORMAT_DESC = "FORMAT_DESC",
    SCORE = "SCORE",
    SCORE_DESC = "SCORE_DESC",
    POPULARITY = "POPULARITY",
    POPULARITY_DESC = "POPULARITY_DESC",
    TRENDING = "TRENDING",
    TRENDING_DESC = "TRENDING_DESC",
    CHAPTERS = "CHAPTERS",
    CHAPTERS_DESC = "CHAPTERS_DESC",
    VOLUMES = "VOLUMES",
    UPDATED_AT = "UPDATED_AT",
    UPDATED_AT_DESC = "UPDATED_AT_DESC"
}

export enum Genres {
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

export enum Status {
    CURRENT = "CURRENT",
    PLANNING = "PLANNING",
    COMPLETED = "COMPLETED",
    DROPPED = "DROPPED",
    PAUSED = "PAUSED",
    REPEATING = "REPEATING"
}

interface SeasonalResponse {
    data: {
        trending: {
            media: Array<Media>
        },
        season: {
            media: Array<Media>
        },
        nextSeason: {
            media: Array<Media>
        },
        popular: {
            media: Array<Media>
        },
        top: {
            media: Array<Media>
        }
    }
}

interface Media {
    id:number;
    idMal:number;
    title: Title;
    coverImage: {
        alt: string; // Connector title
        extraLarge:string;
        large:string;
    };
    bannerImage:string;
    startDate: {
        year:number;
        month:number;
        day:number;
    };
    endDate: {
        year:number;
        month:number;
        day:number;
    };
    description:string;
    season:"WINTER"|"SPRING"|"SUMMER"|"FALL";
    seasonYear:number;
    type:Type;
    format:Format;
    status:"FINISHED"|"RELEASING"|"NOT_YET_RELEASED"|"CANCELLED";
    episodes?:number;
    duration?:number;
    chapters?:number;
    volumes?:number;
    genres:string[];
    synonyms:string[]
    source:"ORIGINAL"|"LIGHT_NOVEL"|"VISUAL_NOVEL"|"VIDEO_GAME"|"OTHER"|"NOVEL"|"MANGA"|"DOUJINSHI"|"ANIME"|"WEB_MANGA"|"BOOK"|"CARD_GAME"|"COMIC"|"GAME"|"MUSIC"|"NOVEL"|"ONE_SHOT"|"OTHER"|"PICTURE_BOOK"|"RADIO"|"TV"|"UNKNOWN";
    isAdult:boolean;
    meanScore:number;
    averageScore:number;
    popularity:number;
    favourites:number;
    countryOfOrigin:string;
    isLicensed:boolean;
    airingSchedule: {
        edges: {
            node: {
                airingAt?:any;
                timeUntilAiring?:any
                episode?:any;
            }
        }
    }
    relations: {
        edges: [RelationsNode]
    };
    characterPreview: {
        edges: {
            id:number;
            role:string;
            name?:string;
            voiceActors: {
                id:number;
                name: {
                    userPreferred:string;
                };
                language:string;
                image: {
                    large:string;
                };
            };
            node: {
                id:number;
                name: {
                    userPreferred:string;
                };
                image: {
                    large:string;
                };
            };
        };
    };
    studios: {
        edges: {
            isMain:boolean;
            node: {
                id:number;
                name:string;
            };
        };
    };
    streamingEpisodes: [{
        title?:string;
        thumbnail?:string;
        url?:string;
    }];
    trailer: {
        id:string;
        site:string;
    };
    tags: {
        id:number;
        name:string;
    };
};

interface Title {
    english?: string;
    romaji?: string;
    native?: string;
    userPreferred?: string;
}

interface RelationsNode {
    id:number;
    relationType:string;
    node: {
        id:number;
        title: {
            userPreferred:string;
        };
        format:Format;
        type:Type;
        status:string;
        bannerImage:string;
        coverImage: {
            large:string;
        }
    };
}

interface UserResponse {
    data: {
        User: {
            id:number;
            name: string;
            previousNames: [string];
            avatar: {
                large:string;
            };
            bannerImage: string;
            about: string;
            isFollowing: boolean;
            isFollower: boolean;
            donatorTier: number;
            donatorBadge: string;
            createdAt: number;
            moderatorRoles?: [string];
            isBlocked: boolean;
            bans: [string];
            options: {
                titleLanguage: string;
                displayAdultContent: boolean;
                airingNotifications: boolean;
                profileColor: string;
                notificationOptions: {
                    activityReply: boolean;
                    activityMention: boolean;
                    activitySubscribed: boolean;
                    activityReplySubscribed: boolean;
                    activityLike: boolean;
                    activityReplyLike: boolean;
                    activityMentionSubscribed: boolean;
                    activityReplies: boolean;
                    activityReplyLikes: boolean;
                    following: boolean;
                    threadCommentMention: boolean;
                    threadSubscribed: boolean;
                    threadCommentReply: boolean;
                    threadCommentSubscribed: boolean;
                    threadLike: boolean;
                    threadCommentLike: boolean;
                    threadCommentReplySubscribed: boolean;
                    threadCommentLikes: boolean;
                    relatedMediaAddition: boolean;
                    mediaList: boolean;
                    airing: boolean;
                    relatedMediaAnnouncement: boolean;
                    activityMessage: boolean;
                    activityMessageSubscribed: boolean;
                    activityMessageReply: boolean;
                    activityMessageReplySubscribed: boolean;
                    activityMessageLike: boolean;
                    activityMessageReplyLike: boolean;
                    activityMessageReplies: boolean;
                    activityMessageReplyLikes: boolean;
                    threadComment: boolean;
                    thread: boolean;
                    activity: boolean;
                };
            };
            mediaListOptions: {
                scoreFormat: string;
                rowOrder: string;
                animeList: {
                    sectionOrder: [string];
                    splitCompletedSectionByFormat: boolean;
                    customLists: [string];
                    advancedScoring: [string];
                    advancedScoringEnabled: boolean;
                };
                mangaList: {
                    sectionOrder: [string];
                    splitCompletedSectionByFormat: boolean;
                    customLists: [string];
                    advancedScoring: [string];
                    advancedScoringEnabled: boolean;
                };
            };
            statistics: {
                anime: {
                    count: number;
                    meanScore: number;
                    standardDeviation: number;
                    minutesWatched: number;
                    episodesWatched: number;
                    genres: [string];
                    tags: [string];
                    formats: [string];
                    statuses: [string];
                    releaseYears: [string];
                    startYears: [string];
                    countries: [string];
                    voiceActors: [string];
                    staff: [string];
                    studios: [string];
                };
                manga: {
                    count: number;
                    meanScore: number;
                    standardDeviation: number;
                    chaptersRead: number;
                    volumesRead: number;
                    genres: [string];
                    tags: [string];
                    formats: [string];
                    statuses: [string];
                    releaseYears: [string];
                    startYears: [string];
                    countries: [string];
                    staff: [string];
                    studios: [string];
                };
            };
            favourites: {
                anime: {
                    nodes: [Media];
                }
                manga: {
                    nodes: [Media];
                }
                characters: {
                    nodes: [Media];
                }
                staff: {
                    nodes: [Media];
                }
                studios: {
                    nodes: [Media];
                }
            };
        };
    };
}

export type { Media };