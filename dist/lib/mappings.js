"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.map = exports.loadMapping = void 0;
const mapping_1 = require("../mapping");
const colors_1 = __importDefault(require("colors"));
const anilist_1 = __importDefault(require("../mapping/impl/information/anilist"));
const helper_1 = require("@/src/helper");
const event_1 = __importStar(require("@/src/helper/event"));
const database_1 = require("database");
const stringSimilarity_1 = require("../helper/stringSimilarity");
// Return a mapped result using the ID given
const loadMapping = async (data) => {
    // First check if exists in database
    const existing = data.type === "ANIME" /* Type.ANIME */ ? await database_1.prisma.anime.findFirst({
        where: {
            id: String(data.id)
        }
    }) : await database_1.prisma.manga.findFirst({
        where: {
            id: String(data.id)
        }
    });
    if (existing) {
        await event_1.default.emitAsync(event_1.Events.COMPLETED_MAPPING_LOAD, [existing]);
        return [existing];
    }
    console.log(colors_1.default.gray("Loading mapping for ") + colors_1.default.blue(data.id) + colors_1.default.gray("..."));
    const aniList = new anilist_1.default();
    // Map only one media
    const aniData = await aniList.getMedia(data.id);
    const result = await (0, exports.map)(aniList, (aniData?.title.english ?? aniData?.title.romaji), aniData?.type, [aniData?.format], aniData);
    // Only return if the ID matches the one we're looking for
    // If it isn't, we don't want to return.
    for (let i = 0; i < result.length; i++) {
        if (String(result[i].id) === String(data.id)) {
            console.log(colors_1.default.gray("Found mapping for ") + colors_1.default.blue(data.id) + colors_1.default.gray(".") + colors_1.default.gray(" Saving..."));
            await event_1.default.emitAsync(event_1.Events.COMPLETED_MAPPING_LOAD, [result[i]]);
            return [result[i]];
        }
    }
};
exports.loadMapping = loadMapping;
const map = async (aniList, query, type, formats, aniData) => {
    console.log(colors_1.default.gray("Searching for ") + colors_1.default.blue(query) + colors_1.default.gray(" of type ") + colors_1.default.blue(type) + colors_1.default.gray(" and of formats ") + (colors_1.default.blue((formats.length > 0 ? formats.toString() : "NONE")))) + colors_1.default.gray("...");
    const providers = (type === "ANIME" /* Type.ANIME */ ? mapping_1.ANIME_PROVIDERS : mapping_1.MANGA_PROVIDERS);
    providers.push(...mapping_1.META_PROVIDERS);
    // Filter out unsuitable providers
    const suitableProviders = providers.filter(provider => {
        if (formats && provider.formats) {
            return formats.some(format => provider.formats.includes(format));
        }
        return true;
    });
    // List of all titles and synonyms
    const titlesAndSynonyms = [
        aniData.title.english,
        aniData.title.romaji,
        aniData.title.native,
        ...aniData.synonyms
    ].filter(e => typeof e === "string" && e);
    // Search via the titles and synonyms in case a provider requires you to search by the romaji or native titles or one of the synonyms.
    const promises = suitableProviders.map(provider => {
        const searchPromises = titlesAndSynonyms.map(title => provider.search(title).catch(() => []));
        return Promise.all(searchPromises).then(results => {
            return results.find(r => r.length !== 0) || [];
        });
    });
    const resultsArray = await Promise.all(promises);
    console.log(colors_1.default.yellow("Finished fetching from providers.") + colors_1.default.blue(" - ") + colors_1.default.yellow(query));
    // Process results and create mappings
    const mappings = [];
    // Prepare batch requests for AniList
    const searchQueries = resultsArray.flat().map((result, index) => {
        const title = (0, helper_1.sanitizeTitle)(result.title);
        return `
            anime${index}: Page(page: 0, perPage: 10) {
                media(type: ${type}, format_in: ${aniData.format}, search: "${title.replace(/"|"/g, "")}") {
                    id
                    idMal
                    title {
                        english
                        romaji
                        native
                        userPreferred
                    }
                    status
                    synonyms
                    format
                    startDate {
                        year
                        month
                        day
                    }
                }
            }
        `;
    });
    const results = (await aniList.batchRequest(searchQueries).catch((err) => {
        return [];
    })).map((data) => {
        return data;
    }).filter(Boolean);
    const batchResults = results.reduce((accumulator, currentObject) => {
        const mediaArrays = Object.values(currentObject).map((anime) => anime.media);
        return accumulator.concat(...mediaArrays);
    }, []);
    console.log(colors_1.default.green("Finished AniList response.") + colors_1.default.blue(" - ") + colors_1.default.green(query));
    // Loop through provider results
    for (let i = 0; i < resultsArray.length; i++) {
        for (let j = 0; j < resultsArray[i].length; j++) {
            const year = (aniData.year ?? aniData.startDate?.year) ?? null;
            if (year && (resultsArray[i][j].year !== 0)) {
                if (Number(resultsArray[i][j].year) !== Number(aniData.year)) {
                    continue;
                }
            }
            const format = (aniData.format);
            if (format && (resultsArray[i][j].format !== "UNKNOWN" /* Format.UNKNOWN */)) {
                if (format !== resultsArray[i][j].format) {
                    continue;
                }
            }
            const aniListResults = batchResults.map(result => {
                const titles = [
                    result.title.english,
                    result.title.romaji,
                    result.title.native,
                    ...result.synonyms
                ].filter(e => typeof e === "string" && e);
                const similarity = (0, stringSimilarity_1.findBestMatch)(resultsArray[i][j].title, titles).bestMatch;
                return { ...result, similarity: similarity.rating };
            }).filter(result => result.similarity > 0.6);
            // Find the best result from the AniList results
            let best = null;
            aniListResults.map(async (result) => {
                if (result.status === "NOT_YET_RELEASED") {
                    return;
                }
                const title = result.title.userPreferred || result.title.romaji || result.title.english || result.title.native;
                const altTitles = Object.values(result.title).concat(result.synonyms);
                const sim = (0, helper_1.similarity)(title, resultsArray[i][j].title, altTitles);
                const tempBest = {
                    index: j,
                    similarity: sim,
                    aniList: result,
                };
                if (!best || sim.value > best.similarity.value) {
                    best = tempBest;
                }
            });
            if (best) {
                const mapping = resultsArray[i][best.index];
                mappings.push({
                    id: best.aniList.id,
                    malId: best.aniList.idMal,
                    slug: (0, helper_1.slugify)((best.aniList.title.english ?? best.aniList.title.romaji ?? best.aniList.title.native)),
                    data: mapping,
                    similarity: best.similarity
                });
            }
        }
    }
    // Create a media object
    const result = await createMedia(mappings, type);
    return result;
};
exports.map = map;
async function createMedia(mappings, type) {
    const results = [];
    for (let i = 0; i < mappings.length; i++) {
        const mapping = mappings[i];
        let hasPushed = false;
        for (let j = 0; j < results.length; j++) {
            if (results[j].id === mapping.id) {
                hasPushed = true;
                const toPush = {
                    id: mapping.data.id,
                    providerId: mapping.data.providerId,
                    similarity: mapping.similarity
                };
                results[j].mappings.push(toPush);
            }
        }
        if (!hasPushed) {
            if (type === "ANIME" /* Type.ANIME */) {
                const anime = {
                    id: mapping.id,
                    malId: mapping.malId,
                    kitsuId: null,
                    slug: mapping.slug,
                    coverImage: "",
                    bannerImage: "",
                    trailer: "",
                    status: null,
                    type: "ANIME" /* Type.ANIME */,
                    season: "UNKNOWN" /* Season.UNKNOWN */,
                    title: {
                        romaji: null,
                        english: null,
                        native: null,
                    },
                    currentEpisode: null,
                    mappings: [
                        {
                            id: mapping.data.id,
                            providerId: mapping.data.providerId,
                            similarity: mapping.similarity
                        }
                    ],
                    synonyms: [],
                    countryOfOrigin: null,
                    description: null,
                    duration: null,
                    color: null,
                    year: null,
                    rating: {
                        anilist: 0,
                        mal: 0,
                        kitsu: 0,
                    },
                    popularity: {
                        anilist: 0,
                        mal: 0,
                        kitsu: 0,
                    },
                    genres: [],
                    format: "UNKNOWN" /* Format.UNKNOWN */,
                    relations: [],
                    totalEpisodes: 0,
                    tags: []
                };
                results.push(anime);
            }
            else {
                const manga = {
                    id: mapping.id,
                    malId: mapping.malId,
                    kitsuId: null,
                    slug: mapping.slug,
                    coverImage: "",
                    bannerImage: "",
                    status: null,
                    type: "MANGA" /* Type.MANGA */,
                    title: {
                        romaji: null,
                        english: null,
                        native: null,
                    },
                    mappings: [
                        {
                            id: mapping.data.id,
                            providerId: mapping.data.providerId,
                            similarity: mapping.similarity
                        }
                    ],
                    synonyms: [],
                    countryOfOrigin: null,
                    description: null,
                    color: null,
                    rating: {
                        anilist: 0,
                        mal: 0,
                        kitsu: 0,
                    },
                    popularity: {
                        anilist: 0,
                        mal: 0,
                        kitsu: 0,
                    },
                    genres: [],
                    format: "UNKNOWN" /* Format.UNKNOWN */,
                    relations: [],
                    totalChapters: 0,
                    totalVolumes: 0,
                    tags: []
                };
                results.push(manga);
            }
        }
    }
    for (let i = 0; i < results.length; i++) {
        for (let j = 0; j < results[i].mappings.length; j++) {
            if (results[i].mappings[j].providerId === "kitsu") {
                results[i].kitsuId = results[i].mappings[j].id;
            }
        }
    }
    for (let i = 0; i < results.length; i++) {
        const media = results[i];
        for (let j = 0; j < mapping_1.INFORMATION_PROVIDERS.length; j++) {
            const provider = mapping_1.INFORMATION_PROVIDERS[j];
            const info = await provider.info(media).catch((err) => {
                console.log(colors_1.default.red(`Error while fetching info for ${media.id} from ${provider.id}`));
                console.log(err);
                return null;
            });
            if (!info) {
                continue;
            }
            fillMediaInfo(media, info, provider);
        }
    }
    return results;
}
function fillMediaInfo(media, info, provider) {
    try {
        const crossLoadFields = ["popularity", "rating"];
        const specialLoadFields = ["title"];
        for (const ak of Object.keys(info)) {
            if (crossLoadFields.includes(ak) || provider.sharedArea.includes(ak) || specialLoadFields.includes(ak))
                continue;
            const v = media[ak];
            let write = false;
            if ((!v || v === "UNKNOWN") && (!!info[ak] && info[ak] !== "UNKNOWN")) {
                write = true;
            }
            else {
                if (provider.priorityArea.includes(ak) && !!info[ak])
                    write = true;
            }
            if (write)
                media[ak] = info[ak];
        }
        for (const special of specialLoadFields) {
            const v = info[special];
            if (v) {
                for (const [ak, av] of Object.entries(v)) {
                    if (av && av?.length) {
                        media[special][ak] = av;
                    }
                }
            }
        }
        for (const shared of provider.sharedArea) {
            if (!media[shared]) {
                media[shared] = [];
            }
            media[shared] = [...new Set(media[shared].concat(info[shared]))];
        }
        for (const crossLoad of crossLoadFields) {
            media[crossLoad][provider.id] = info[crossLoad];
        }
        return media;
    }
    catch (e) {
        console.log(colors_1.default.red(`Error while filling media info for ${media.id} with provider ${provider.id}`));
        return media;
    }
}
