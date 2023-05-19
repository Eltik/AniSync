import { ANIME_PROVIDERS, Anime, Format, INFORMATION_PROVIDERS, MANGA_PROVIDERS, META_PROVIDERS, Manga, Result, Season, Type } from "../mapping";
import colors from "colors";
import AniList from "../mapping/impl/information/anilist";
import { sanitizeTitle, similarity, slugify, wait } from "@/src/helper";
import InformationProvider, { AnimeInfo, MangaInfo } from "../mapping/impl/information";
import emitter, { Events } from "@/src/helper/event";
import { prisma } from "database";
import { findBestMatch } from "../helper/stringSimilarity";

// Return a mapped result using the ID given
export const loadMapping = async (data: { id: string; type: Type }) => {
    try {
        // First check if exists in database
        const existing =
            data.type === Type.ANIME
                ? await prisma.anime.findFirst({
                      where: {
                          id: String(data.id),
                      },
                  })
                : await prisma.manga.findFirst({
                      where: {
                          id: String(data.id),
                      },
                  });

        if (existing) {
            await emitter.emitAsync(Events.COMPLETED_MAPPING_LOAD, [existing]);
            return [existing];
        }
    } catch (e) {
        console.error(e);
        console.log(colors.red("Error while fetching from database."));
    }

    console.log(colors.gray("Loading mapping for ") + colors.blue(data.id) + colors.gray("..."));

    const aniList = new AniList();
    // Map only one media
    const aniData = await aniList.getMedia(data.id);

    const result = await map(aniList, (aniData?.title.english ?? aniData?.title.romaji)!, (aniData as any)?.type, [aniData?.format!], aniData);

    // Only return if the ID matches the one we're looking for
    // If it isn't, we don't want to return.
    for (let i = 0; i < result.length; i++) {
        if (String(result[i].id) === String(data.id)) {
            console.log(colors.gray("Found mapping for ") + colors.blue(data.id) + colors.gray(".") + colors.gray(" Saving..."));
            await emitter.emitAsync(Events.COMPLETED_MAPPING_LOAD, [result[i]]);
            return [result[i]];
        }
    }

    await emitter.emitAsync(Events.COMPLETED_MAPPING_LOAD, []);
    return [];
};

export const map = async (aniList: AniList, query: string, type: Type, formats: Format[], aniData: any): Promise<Anime[] | Manga[]> => {
    console.log(colors.gray("Searching for ") + colors.blue(query) + colors.gray(" of type ") + colors.blue(type) + colors.gray(" and of formats ") + colors.blue(formats.length > 0 ? formats.toString() : "NONE")) + colors.gray("...");
    const providers: any[] = type === Type.ANIME ? ANIME_PROVIDERS : MANGA_PROVIDERS;
    providers.push(...(META_PROVIDERS as any));

    // Filter out unsuitable providers
    const suitableProviders = providers.filter((provider) => {
        if (formats && provider.formats) {
            return formats.some((format) => provider.formats.includes(format));
        }
        return true;
    });

    // List of all titles and synonyms
    const titlesAndSynonyms = [aniData.title.english, aniData.title.romaji, aniData.title.native, ...aniData.synonyms].filter((e) => typeof e === "string" && e);

    // Search via the titles and synonyms in case a provider requires you to search by the romaji or native titles or one of the synonyms.
    const promises = suitableProviders.map((provider) => {
        const searchPromises = titlesAndSynonyms.map((title) => provider.search(title).catch(() => []));
        return Promise.all(searchPromises).then((results) => {
            return results.find((r) => r.length !== 0) || [];
        });
    });

    const resultsArray = await Promise.all(promises);
    console.log(colors.yellow("Finished fetching from providers.") + colors.blue(" - ") + colors.yellow(query));

    // Process results and create mappings
    const mappings: MappedResult[] = [];

    // Prepare batch requests for AniList
    const searchQueries = resultsArray.flat().map((result, index) => {
        const title = sanitizeTitle(result.title);
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

    const results = (
        await aniList.batchRequest(searchQueries, 30).catch((err) => {
            return [];
        })
    ).filter(Boolean);

    const batchResults = results.reduce((accumulator, currentObject) => {
        const mediaArrays = Object.values(currentObject).map((anime: any) => anime.media);
        return accumulator.concat(...mediaArrays);
    }, []);
    console.log(colors.green("Finished AniList response.") + colors.blue(" - ") + colors.green(query));

    // Loop through provider results
    for (let i = 0; i < resultsArray.length; i++) {
        for (let j = 0; j < resultsArray[i].length; j++) {
            const year = aniData.year ?? aniData.startDate?.year ?? null;
            if (year && resultsArray[i][j].year !== 0) {
                if (Number(resultsArray[i][j].year) !== Number(aniData.year)) {
                    continue;
                }
            }
            const format = aniData.format;
            if (format && resultsArray[i][j].format !== Format.UNKNOWN) {
                if (format !== resultsArray[i][j].format) {
                    continue;
                }
            }

            const aniListResults = batchResults
                .map((result) => {
                    const titles = [result.title.english, result.title.romaji, result.title.native, ...result.synonyms].filter((e) => typeof e === "string" && e);
                    const similarity = findBestMatch(resultsArray[i][j].title, titles).bestMatch;
                    return { ...result, similarity: similarity.rating };
                })
                .filter((result) => result.similarity > 0.6);

            // Find the best result from the AniList results
            let best: any = null;
            aniListResults.map(async (result) => {
                if (result.status === "NOT_YET_RELEASED") {
                    return;
                }

                const title = result.title.userPreferred || result.title.romaji || result.title.english || result.title.native;
                const altTitles: any[] = Object.values(result.title).concat(result.synonyms);

                const sim = similarity(title, resultsArray[i][j].title, altTitles);

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
                    slug: slugify(best.aniList.title.english ?? best.aniList.title.romaji ?? best.aniList.title.native),
                    data: mapping,
                    similarity: best.similarity,
                });
            }
        }
    }

    // Create a media object
    const result = await createMedia(mappings, type);

    return result;
};

async function createMedia(mappings: MappedResult[], type: Type): Promise<Anime[] | Manga[]> {
    const results: any[] = [];

    for (let i = 0; i < mappings.length; i++) {
        const mapping = mappings[i];

        let hasPushed = false;
        for (let j = 0; j < results.length; j++) {
            if (results[j].id === mapping.id) {
                hasPushed = true;
                const toPush = {
                    id: mapping.data.id,
                    providerId: mapping.data.providerId,
                    similarity: mapping.similarity,
                };
                results[j].mappings.push(toPush);
            }
        }

        if (!hasPushed) {
            if (type === Type.ANIME) {
                const anime: Anime = {
                    id: mapping.id,
                    malId: mapping.malId,
                    kitsuId: null,
                    slug: mapping.slug,
                    coverImage: "",
                    bannerImage: "",
                    trailer: "",
                    status: null,
                    type: Type.ANIME,
                    season: Season.UNKNOWN,
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
                            similarity: mapping.similarity,
                        },
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
                    format: Format.UNKNOWN,
                    relations: [],
                    totalEpisodes: 0,
                    tags: [],
                };
                results.push(anime);
            } else {
                const manga: Manga = {
                    id: mapping.id,
                    malId: mapping.malId,
                    kitsuId: null,
                    slug: mapping.slug,
                    coverImage: "",
                    bannerImage: "",
                    status: null,
                    type: Type.MANGA,
                    title: {
                        romaji: null,
                        english: null,
                        native: null,
                    },
                    mappings: [
                        {
                            id: mapping.data.id,
                            providerId: mapping.data.providerId,
                            similarity: mapping.similarity,
                        },
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
                    format: Format.UNKNOWN,
                    relations: [],
                    totalChapters: 0,
                    totalVolumes: 0,
                    tags: [],
                };
                results.push(manga);
            }
        }
    }

    for (let i = 0; i < results.length; i++) {
        for (let j = 0; j < results[i].mappings.length; j++) {
            if (results[i].mappings[j].providerId === "kitsuanime" || results[i].mappings[j].providerId === "kitsumanga") {
                results[i].kitsuId = results[i].mappings[j].id;
            }
        }
    }

    for (let i = 0; i < results.length; i++) {
        const media = results[i];

        for (let j = 0; j < INFORMATION_PROVIDERS.length; j++) {
            const provider = INFORMATION_PROVIDERS[j];
            const info = await provider.info(media).catch((err) => {
                console.log(colors.red(`Error while fetching info for ${media.id} from ${provider.id}`));
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

function fillMediaInfo<T extends Anime | Manga, U extends AnimeInfo | MangaInfo>(media: T, info: U, provider: InformationProvider<T, U>): T {
    try {
        const crossLoadFields: (keyof AnimeInfo | MangaInfo)[] = ["popularity", "rating"];
        const specialLoadFields: (keyof AnimeInfo | MangaInfo)[] = ["title"];

        for (const ak of Object.keys(info)) {
            if (crossLoadFields.includes(ak as any) || provider.sharedArea.includes(ak as any) || specialLoadFields.includes(ak as any)) continue;

            const v = media[ak];

            let write = false;
            if ((!v || v === "UNKNOWN") && !!info[ak] && info[ak] !== "UNKNOWN") {
                write = true;
            } else {
                if (provider.priorityArea.includes(ak as any) && !!info[ak]) write = true;
            }

            if (write) media[ak] = info[ak];
        }

        for (const special of specialLoadFields) {
            const v = info[special as any];

            if (v) {
                for (const [ak, av] of Object.entries(v)) {
                    if (av && (av as any)?.length) {
                        media[special as any][ak] = av;
                    }
                }
            }
        }

        for (const shared of provider.sharedArea) {
            if (!media[shared as any]) {
                media[shared as any] = [];
            }

            media[shared as any] = [...new Set(media[shared as any].concat(info[shared as any]))];
        }

        for (const crossLoad of crossLoadFields) {
            media[crossLoad as any][provider.id] = info[crossLoad as any];
        }

        return media;
    } catch (e) {
        console.log(colors.red(`Error while filling media info for ${media.id} with provider ${provider.id}`));
        return media;
    }
}

interface MappedResult {
    id: string;
    malId: string;
    slug: string;
    data: Result;
    similarity: number;
}
