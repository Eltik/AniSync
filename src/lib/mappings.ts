import { ANIME_PROVIDERS, Anime, Format, INFORMATION_PROVIDERS, MANGA_PROVIDERS, META_PROVIDERS, Manga, Result, Season, Type } from "../mapping";
import colors from "colors";
import AniList from "../mapping/impl/information/anilist";
import { sanitizeTitle, similarity, slugify, wait } from "@/src/helper";
import InformationProvider, { AnimeInfo, MangaInfo } from "../mapping/impl/information";
import emitter, { Events } from '@/src/helper/event';
import { prisma } from "database";

export const loadMapping = async(data: { id:string, type:Type }) => {
    // First check if exists in database
    const existing = data.type === Type.ANIME ? await prisma.anime.findFirst({
        where: {
            id: String(data.id)
        }
    }) : await prisma.manga.findFirst({
        where: {
            id: String(data.id)
        }
    });

    if (existing) {
        await emitter.emitAsync(Events.COMPLETED_MAPPING_LOAD, [existing]);
        return [existing];
    }

    console.log(colors.gray("Loading mapping for ") + colors.blue(data.id) + colors.gray("..."));
    
    const aniList = new AniList();
    const aniData = await aniList.getMedia(data.id);
    
    // @ts-ignore
    const result = await map((aniData?.title.english ?? aniData?.title.romaji)!, (aniData?.type), [aniData?.format!], aniData);
    
    for (let i = 0; i < result.length; i++) {
        if (String(result[i].id) === String(data.id)) {
            await emitter.emitAsync(Events.COMPLETED_MAPPING_LOAD, [result[i]]);
            return [result[i]];
        }
    }
}

export const map = async (query: string, type: Type, formats: Format[], aniData: any): Promise<Anime[] | Manga[]> => {
    console.log(colors.gray("Searching for ") + colors.blue(query) + colors.gray(" of type ") + colors.blue(type) + colors.gray(" and of formats ") + (colors.blue((formats.length > 0 ? formats.toString() : "NONE")))) + colors.gray("...");
    
    const aniList = new AniList();

    const providers = (type === Type.ANIME ? ANIME_PROVIDERS : MANGA_PROVIDERS);
    providers.push(...META_PROVIDERS as any);

    const mappings: { id: string, malId: string, slug: string, data: Result, similarity: number }[] = [];

    const promises: Promise<Result[]>[] = [];
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

        const promise: Promise<Result[]> = new Promise((resolve, reject) => {
            provider.search(query).then(async(data) => {

                // Sometimes providers doesn't take certain queries. This is a workaround.
                if (data?.length === 0 && aniData.title.english) {
                    data = await provider.search(aniData.title.english);
                    await wait(1000);
                }
                if (data?.length === 0 && aniData.title.romaji) {
                    data = await provider.search(aniData.title.romaji);
                    await wait(1000);
                }
                if (data?.length === 0 && aniData.title.native) {
                    data = await provider.search(aniData.title.native);
                    await wait(1000);
                }
                if (data?.length === 0 && aniData.synonyms?.length > 0) {
                    for (let i = 0; i < aniData.synonyms.length; i++) {
                        data = await provider.search(aniData.synonyms[i]);
                        if (data!.length > 0) {
                            break;
                        }
                        await wait(1000);
                    }
                }
                resolve(data!);
            }).catch((err) => {
                console.log(colors.red("Error fetching from provider " + colors.blue(provider.id) + ": " + colors.yellow(err.message ? err.message : err)));
                resolve([]);
            });
        });
        promises.push(promise);
    }
    const resultsArray = await Promise.all(promises);
    
    for (let i = 0; i < resultsArray.length; i++) {
        for (let j = 0; j < resultsArray[i].length; j++) {
            const aniListResults = await aniList.search(sanitizeTitle(resultsArray[i][j].title), type, formats);
            if (!aniListResults) {
                continue;
            }
        
            let best: any = null;
            aniListResults.map(async (result) => {
                if (result.status === "NOT_YET_RELEASED") {
                    return;
                }

                const title = result.title.userPreferred || result.title.romaji || result.title.english || result.title.native;
                const altTitles:any[] = Object.values(result.title).concat(result.synonyms);

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
                    id: best.aniList.aniListId,
                    malId: best.aniList.malId,
                    slug: slugify((best.aniList.title.english ?? best.aniList.title.romaji ?? best.aniList.title.native)),
                    data: mapping,
                    similarity: best.similarity
                });
            }
        }
    }

    const result = await createMedia(mappings, type);

    return result;
};

async function createMedia(mappings: { id: string, malId: string, slug: string, data: Result, similarity: number }[], type:Type): Promise<Anime[] | Manga[]> {
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
                    similarity: mapping.similarity
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
                            similarity: mapping.similarity
                        }
                    ],
                    synonyms: [],
                    countryOfOrigin: null,
                    description:  null,
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
                    tags: []
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
                            similarity: mapping.similarity
                        }
                    ],
                    synonyms: [],
                    countryOfOrigin: null,
                    description:  null,
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

        for (let j = 0; j < INFORMATION_PROVIDERS.length; j++) {
            const provider = INFORMATION_PROVIDERS[j];
            const info = await provider.info(media);

            if (!info) {
                continue;
            }

            fillMediaInfo(media, info, provider);
        }
    }

    return results;
}

function fillMediaInfo(media: Anime | Manga, info: AnimeInfo | MangaInfo, provider: InformationProvider): Anime | Manga {
    const crossLoadFields: (keyof AnimeInfo|MangaInfo)[] = ["popularity", "rating"];
    const specialLoadFields: (keyof AnimeInfo|MangaInfo)[] = ["title"];

    for (let ak of Object.keys(info)) {
        // @ts-ignore
        if (crossLoadFields.includes(ak) || provider.sharedArea.includes(ak) || specialLoadFields.includes(ak)) continue;

        const v = media[ak];

        let write = false;
        if ((!v || v === "UNKNOWN") && (!!info[ak] && info[ak] !== "UNKNOWN")) {
            write = true;
        } else {
            // @ts-ignore
            if (provider.priorityArea.includes(ak) && !!info[ak]) write = true;
        }

        if (write) media[ak] = info[ak];
    }

    for (let special of specialLoadFields) {
        // @ts-ignore
        const v = info[special];

        if (v) {
            for (let [ak, av] of Object.entries(v)) {
                if (av && (av as any)?.length) {
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