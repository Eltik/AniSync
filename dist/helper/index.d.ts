/// <reference types="node" />
export declare const USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36";
export declare function wait(time: number): Promise<unknown>;
export declare function isJson(str: string): boolean;
export declare function substringBefore(str: string, toFind: string): string;
export declare function substringAfter(str: string, toFind: string): string;
export declare function sanitizeTitle(title: any): string;
export declare function similarity(externalTitle: any, title: any, titleArray?: string[]): {
    same: boolean;
    value: number;
};
export declare function stringSearch(string: string, pattern: string): number;
export declare function setIntervalImmediately(func: () => Promise<void>, interval: any): NodeJS.Timer;
export declare const slugify: (...args: (string | number)[]) => string;
