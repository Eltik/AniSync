import axios from "axios";
import InformationProvider, { AnimeInfo, MangaInfo } from ".";
import { Anime, Format, Manga, Season, Type } from "../..";

export default class Kitsu extends InformationProvider {
    override id = "kitsu";
    override url = "https://kitsu.io";

    private kitsuApiUrl = "https://kitsu.io/api/edge";

    override get priorityArea(): (keyof AnimeInfo | MangaInfo)[] {
        return ["coverImage"];
    }

    override get sharedArea(): (keyof AnimeInfo | MangaInfo)[] {
        return ["synonyms", "genres"];
    }

    override async info(media: Anime | Manga): Promise<AnimeInfo | MangaInfo | undefined> {
        const kitsuId = media.kitsuId;

        if (!kitsuId || kitsuId.length === 0) return undefined;

        const kitsuResponse: KitsuResponse = await (await axios(`${this.kitsuApiUrl}/${media.type.toLowerCase()}/${kitsuId}`)).data;

        const attributes = kitsuResponse?.data?.attributes;

        if (!attributes) return undefined;

        const kitsuGenre = await (await axios(`${this.kitsuApiUrl}/${media.type.toLowerCase()}/${kitsuId}/genres`)).data;
        const genres = kitsuGenre?.data;

        return {
            title: {
                english: attributes.titles.en ?? null,
                romaji: attributes.titles.en_jp ?? null,
                native: attributes.titles.ja_jp ?? null
            },
            currentEpisode: null,
            trailer: null,
            duration: attributes.episodeLength ?? null,
            color: null,
            bannerImage: attributes.coverImage?.original ?? null,
            coverImage: attributes.posterImage?.original ?? null,
            status: null,
            format: Format.UNKNOWN,
            season: Season.UNKNOWN,
            synonyms: [],
            description: attributes.synopsis ?? null,
            year: null,
            totalEpisodes: attributes.episodeCount ?? 0,
            genres: genres ? genres.map(genre => genre.attributes.name) : [],
            rating: attributes.averageRating ? Number.parseFloat((Number.parseFloat(attributes.averageRating) / 10).toFixed(2)) : null,
            popularity: null,
            countryOfOrigin: null,
            tags: []
        }
    }
}

type KitsuResponse = {
    data: {
        attributes: {
            titles: {
                en: string | null,
                en_jp: string | null,
                ja_jp: string | null
            },
            description: string | null,
            subtype: string,
            status: string,
            showType: string,
            synopsis: string | null,
            episodeLength: number | null,
            posterImage: {
                original: string | null
            },
            coverImage: {
                original: string | null
            },
            averageRating: string | null,
            episodeCount: number | null
        }
    }
}