import { Format, Type } from "../mapping";
export declare const loadSearch: (data: {
    query: string;
    type: Type;
    formats: Format[];
}) => Promise<import("../mapping/impl/information").AnimeInfo[] | import("../mapping/impl/information").MangaInfo[] | undefined>;
