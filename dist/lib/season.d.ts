import { Format, Type } from "../mapping";
export declare const loadSeasonal: (data: {
    type: Type;
    formats: Format[];
}) => Promise<{
    trending: any;
    seasonal: any;
    popular: any;
    top: any;
} | undefined>;
