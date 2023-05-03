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
    const aniData = await aniList.getMedia(data.id);
    // @ts-ignore
    const result = await (0, exports.map)((aniData?.title.english ?? aniData?.title.romaji), (aniData?.type), [aniData?.format], aniData);
    for (let i = 0; i < result.length; i++) {
        if (String(result[i].id) === String(data.id)) {
            console.log(colors_1.default.gray("Found mapping for ") + colors_1.default.blue(data.id) + colors_1.default.gray(".") + colors_1.default.gray(" Saving..."));
            await event_1.default.emitAsync(event_1.Events.COMPLETED_MAPPING_LOAD, [result[i]]);
            return [result[i]];
        }
    }
};
exports.loadMapping = loadMapping;
const map = async (query, type, formats, aniData) => {
    console.log(colors_1.default.gray("Searching for ") + colors_1.default.blue(query) + colors_1.default.gray(" of type ") + colors_1.default.blue(type) + colors_1.default.gray(" and of formats ") + (colors_1.default.blue((formats.length > 0 ? formats.toString() : "NONE")))) + colors_1.default.gray("...");
    const aniList = new anilist_1.default();
    const providers = (type === "ANIME" /* Type.ANIME */ ? mapping_1.ANIME_PROVIDERS : mapping_1.MANGA_PROVIDERS);
    providers.push(...mapping_1.META_PROVIDERS);
    const mappings = [];
    const promises = [];
    for (let i = 0; i < providers.length; i++) {
        const provider = providers[i];
        // Check format
        if (formats && provider.formats) {
            let canSearch = true;
            for (let j = 0; j < formats.length; j++) {
                if (!provider.formats.includes(formats[j])) {
                    canSearch = false;
                    break;
                }
            }
            if (!canSearch) {
                continue;
            }
        }
        const promise = new Promise(async (resolve, reject) => {
            let data = await provider.search(query).catch((err) => {
                console.log(colors_1.default.red("Error fetching from provider " + colors_1.default.blue(provider.id) + ": " + colors_1.default.yellow(err.message ? err.message : err)));
                resolve([]);
            });
            // Sometimes providers doesn't take certain queries. This is a workaround.
            if (data?.length === 0 && aniData.title.english) {
                console.log(colors_1.default.gray("No results found for ") + colors_1.default.blue(query) + colors_1.default.gray(" on provider ") + colors_1.default.blue(provider.id) + colors_1.default.gray(". Trying with ") + colors_1.default.blue(aniData.title.english) + colors_1.default.gray("..."));
                data = await provider.search(aniData.title.english).catch((err) => {
                    console.log(colors_1.default.red("Error fetching from provider " + colors_1.default.blue(provider.id) + ": " + colors_1.default.yellow(err.message ? err.message : err)));
                    return [];
                });
                await (0, helper_1.wait)(250);
            }
            if (data?.length === 0 && aniData.title.romaji) {
                console.log(colors_1.default.gray("No results found for ") + colors_1.default.blue(query) + colors_1.default.gray(" on provider ") + colors_1.default.blue(provider.id) + colors_1.default.gray(". Trying with ") + colors_1.default.blue(aniData.title.romaji) + colors_1.default.gray("..."));
                data = await provider.search(aniData.title.romaji).catch((err) => {
                    console.log(colors_1.default.red("Error fetching from provider " + colors_1.default.blue(provider.id) + ": " + colors_1.default.yellow(err.message ? err.message : err)));
                    return [];
                });
                await (0, helper_1.wait)(250);
            }
            if (data?.length === 0 && aniData.title.native) {
                console.log(colors_1.default.gray("No results found for ") + colors_1.default.blue(query) + colors_1.default.gray(" on provider ") + colors_1.default.blue(provider.id) + colors_1.default.gray(". Trying with ") + colors_1.default.blue(aniData.title.native) + colors_1.default.gray("..."));
                data = await provider.search(aniData.title.native).catch((err) => {
                    console.log(colors_1.default.red("Error fetching from provider " + colors_1.default.blue(provider.id) + ": " + colors_1.default.yellow(err.message ? err.message : err)));
                    return [];
                });
                await (0, helper_1.wait)(250);
            }
            if (data?.length === 0 && aniData.synonyms?.length > 0) {
                for (let i = 0; i < aniData.synonyms.length; i++) {
                    console.log(colors_1.default.gray("No results found for ") + colors_1.default.blue(query) + colors_1.default.gray(" on provider ") + colors_1.default.blue(provider.id) + colors_1.default.gray(". Trying with ") + colors_1.default.blue(aniData.synonyms[i]) + colors_1.default.gray("..."));
                    data = await provider.search(aniData.synonyms[i]).catch((err) => {
                        console.log(colors_1.default.red("Error fetching from provider " + colors_1.default.blue(provider.id) + ": " + colors_1.default.yellow(err.message ? err.message : err)));
                        return [];
                    });
                    if (data.length > 0) {
                        break;
                    }
                    await (0, helper_1.wait)(250);
                }
            }
            resolve(data);
        });
        promises.push(promise);
    }
    console.log(colors_1.default.gray("Waiting for all providers to finish..."));
    const resultsArray = await Promise.all(promises);
    console.log(colors_1.default.yellow("Finished fetching from providers."));
    for (let i = 0; i < resultsArray.length; i++) {
        for (let j = 0; j < resultsArray[i].length; j++) {
            const year = (aniData.year ?? aniData.startDate?.year) ?? null;
            if (year && (resultsArray[i][j].year !== 0)) {
                if (Number(resultsArray[i][j].year) !== Number(aniData.year)) {
                    continue;
                }
            }
            const aniListResults = await aniList.search((0, helper_1.sanitizeTitle)(resultsArray[i][j].title), type, formats);
            if (!aniListResults) {
                continue;
            }
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
                    id: best.aniList.aniListId,
                    malId: best.aniList.malId,
                    slug: (0, helper_1.slugify)((best.aniList.title.english ?? best.aniList.title.romaji ?? best.aniList.title.native)),
                    data: mapping,
                    similarity: best.similarity
                });
            }
        }
    }
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
        for (let ak of Object.keys(info)) {
            // @ts-ignore
            if (crossLoadFields.includes(ak) || provider.sharedArea.includes(ak) || specialLoadFields.includes(ak))
                continue;
            const v = media[ak];
            let write = false;
            if ((!v || v === "UNKNOWN") && (!!info[ak] && info[ak] !== "UNKNOWN")) {
                write = true;
            }
            else {
                // @ts-ignore
                if (provider.priorityArea.includes(ak) && !!info[ak])
                    write = true;
            }
            if (write)
                media[ak] = info[ak];
        }
        for (let special of specialLoadFields) {
            // @ts-ignore
            const v = info[special];
            if (v) {
                for (let [ak, av] of Object.entries(v)) {
                    if (av && av?.length) {
                        // @ts-ignore
                        media[special][ak] = av;
                    }
                }
            }
        }
        for (let shared of provider.sharedArea) {
            // @ts-ignore
            if (!media[shared]) {
                // @ts-ignore
                media[shared] = [];
            }
            // @ts-ignore
            media[shared] = [...new Set(media[shared].concat(info[shared]))];
        }
        for (let crossLoad of crossLoadFields) {
            // @ts-ignore
            media[crossLoad][provider.id] = info[crossLoad];
        }
        return media;
    }
    catch (e) {
        console.log(colors_1.default.red(`Error while filling media info for ${media.id} with provider ${provider.id}`));
        return media;
    }
}
