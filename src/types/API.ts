import PromiseRequest, { Options, Response } from "../libraries/promise-request";
import { ReadStream, WriteStream } from "fs";
import { load } from "cheerio";

export default class API {
    public sentRequests:SentRequest[] = [];

    private userAgent:string = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36';
    public providerType:ProviderType;
    public config = {
        debug: true,
        web_server: {
            url: "https://api.anisync.com",
            main_url: "https://anisync.com",
            cors: ["https://anisync.com", "https://api.anisync.com", "http://localhost:3000", "http://localhost:3060"],
            port: 3060
        },
        AniList: {
            SEASON: "WINTER",
            SEASON_YEAR: 2023,
            NEXT_SEASON: "SPRING",
            NEXT_YEAR: 2023,
            oath_id: -1,
            oath_secret: ""
        },
        database_url: "postgresql://postgres:password@localhost:3306",
        is_sqlite: false,
        isPython3: false
    }

    constructor(type:ProviderType, options?) {
        this.providerType = type;
        this.loadConfig(options);
    }

    public loadConfig(options?) {
        if (process.env.DEBUG) {
            this.config.debug = process.env.DEBUG.toLowerCase() === "true";
        }
        if (process.env.WEB_SERVER_URL) {
            this.config.web_server.url = process.env.WEB_SERVER_URL;
        }
        if (process.env.WEB_SERVER_MAIN_URL) {
            this.config.web_server.main_url = process.env.WEB_SERVER_MAIN_URL;
        }
        if (process.env.WEB_SERVER_CORS) {
            this.config.web_server.cors = process.env.WEB_SERVER_CORS.split(",");
        }
        if (process.env.WEB_SERVER_PORT) {
            this.config.web_server.port = Number(process.env.WEB_SERVER_PORT);
        }
        if (process.env.ANILIST_SEASON) {
            this.config.AniList.SEASON = process.env.ANILIST_SEASON;
        }
        if (process.env.ANILIST_SEASON_YEAR) {
            this.config.AniList.SEASON_YEAR = Number(process.env.ANILIST_SEASON_YEAR);
        }
        if (process.env.ANILIST_NEXT_SEASON) {
            this.config.AniList.NEXT_SEASON = process.env.ANILIST_NEXT_SEASON;
        }
        if (process.env.ANILIST_NEXT_YEAR) {
            this.config.AniList.NEXT_YEAR = Number(process.env.ANILIST_NEXT_YEAR);
        }
        if (process.env.ANILIST_OATH_ID) {
            this.config.AniList.oath_id = Number(process.env.ANILIST_OATH_ID);
        }
        if (process.env.ANILIST_OATH_SECRET) {
            this.config.AniList.oath_secret = process.env.ANILIST_OATH_SECRET;
        }
        if (process.env.DATABASE_URL) {
            this.config.database_url = process.env.DATABASE_URL;
        }
        if (process.env.IS_SQLITE) {
            this.config.is_sqlite = process.env.IS_SQLITE.toLowerCase() === "true";
        }
        if (process.env.IS_PYTHON3) {
            this.config.isPython3 = process.env.IS_PYTHON3.toLowerCase() === "true";
        }

        if (options) {
            this.config = {
                ...this.config,
                ...options
            }
        }
    }

    public async fetch(url:string, options?:Options): Promise<Response> {
        const request = new PromiseRequest(url, {
            ...options,
            headers: {
                ...options?.headers,
                'User-Agent': this.userAgent
            }
        });

        const possible = this.getCachedRequest(url, options);
        if (!possible) {
            let error = undefined;
            const data = await request.request().catch(async(err) => {
                error = err;
                return null;
            });
            if (!data) {
                return error;
            }

            this.sentRequests.push({
                url: url,
                options: options,
                sent: new Date(Date.now()).getTime(),
                response: data
            })
            return data;
        } else {
            return possible;
        }
    }

    public getCachedRequest(url:string, options?:Options):Response {
        let res:SentRequest = null;
        
        const toRemove = [];
        for (let i = 0; i < this.sentRequests.length; i++) {
            const req = this.sentRequests[i];
            if (req.url === url) {
                let isCached = false;
                if (options && req.options) {
                    if (options.body) {
                        if (options.body === req.options.body) {
                            isCached = true;
                        }
                    } else {
                        isCached = true;
                    }
                } else {
                    isCached = true;
                }
                if (isCached) {
                    const now = new Date(Date.now());
                    if (now.getTime() - req.sent > 3600000) { // 1 hour
                        toRemove.push(i);
                    } else {
                        res = req;
                    }
                }
            }
        }

        for (let i = 0; i < toRemove.length; i++) {
            this.sentRequests.splice(toRemove[i], 1);
        }

        if (res != null && res.response.status === 200) {
            return res.response;
        }
    }

    public async stream(url:string, stream:ReadableStream|WritableStream|ReadStream|WriteStream, options?:Options) {
        const request = new PromiseRequest(url, {
            ...options,
            stream: true,
            headers: {
                ...options?.headers,
                'User-Agent': this.userAgent
            }
        });
        const final = await request.stream(stream).catch((err) => {
            console.error(err);
            return null;
        });
        return final;
    }

    public async wait(time:number) {
        return new Promise(resolve => {
            setTimeout(resolve, time);
        });
    }

    public static async wait(time:number) {
        return new Promise(resolve => {
            setTimeout(resolve, time);
        });
    }

    public getRandomInt(max):number {
        return Math.floor(Math.random() * max);
    }

    public makeId(length) {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() *
                charactersLength));
        }
        return result;
    }

    public stringSearch(string:string, pattern:string):number {
        let count = 0;
        string = string.toLowerCase();
        pattern = pattern.toLowerCase();
        string = string.replace(/[^a-zA-Z0-9 -]/g, "");
        pattern = pattern.replace(/[^a-zA-Z0-9 -]/g, "");
        
        for (let i = 0; i < string.length; i++) {
            for (let j = 0; j < pattern.length; j++) {
                if (pattern[j] !== string[i + j]) break;
                if (j === pattern.length - 1) count++;
            }
        }
        return count;
    }

    public encrypt(data:string):string {
        const key = "DzmuZuXqa90";
        const encoded = encodeURIComponent("".concat(data));
    
        const result = btoa(this.rc4(key, encoded));
        return result;
    }
    
    public decrypt(data:string):string {
        const key = "DzmuZuXqa90";
        return decodeURIComponent(this.rc4(key, atob(data)));
    }
    
    public rc4(key:string, str:string):string {
        const s = [];
        
        let j = 0;
        let x;
        let res = "";
        
        for (let i = 0; i < 256; i++) {
            s[i] = i;
        }
    
        for (let i = 0; i < 256; i++) {
            j = (j + s[i] + key.charCodeAt(i % key.length)) % 256;
            x = s[i];
            s[i] = s[j];
            s[j] = x;
        }
    
        let i = 0;
        j = 0;
        
        for (let y = 0; y < str.length; y++) {
            i = (i + 1) % 256;
            j = (j + s[i]) % 256;
            x = s[i];
            s[i] = s[j];
            s[j] = x;
            res += String.fromCharCode(str.charCodeAt(y) ^ s[(s[i] + s[j]) % 256]);
        }
        return res;
    }

    public async solveCaptcha3(key: string, anchorLink: string, url: string): Promise<string> {
        const uri = new URL(url);
        const domain = uri.protocol + '//' + uri.host;

        const keyReq = await this.fetch(`https://www.google.com/recaptcha/api.js?render=${key}`, {
            headers: {
                Referer: domain,
            },
        });

        const data = keyReq.text();

        const v = data.substring(data.indexOf('/releases/'), data.lastIndexOf('/recaptcha')).split('/releases/')[1];

        // ANCHOR IS SPECIFIC TO SITE
        const curK = anchorLink.split('k=')[1].split('&')[0];
        const curV = anchorLink.split("v=")[1].split("&")[0];

        const anchor = anchorLink.replace(curK, key).replace(curV, v);

        const req = await this.fetch(anchor);
        const $ = load(req.text());
        const reCaptchaToken = $('input[id="recaptcha-token"]').attr('value')

        if (!reCaptchaToken) throw new Error('reCaptcha token not found')

        return reCaptchaToken;
    }

    public async solveCaptcha3FromHTML(html: string, anchorLink: string, url:string) {
        const $ = load(html);

        let captcha = null;
        $("script").map((index, element) => {
            if ($(element).attr("src") != undefined && $(element).attr("src").includes("/recaptcha/")) {
                captcha = $(element).attr("src");
            }
        })

        if (!captcha) {
            throw new Error("Couldn't fetch captcha.");
        }

        const captchaURI = new URL(captcha);
        const captchaId = captchaURI.searchParams.get("render");
        const captchaKey = await this.solveCaptcha3(captchaId, anchorLink, url);
        return captchaKey;
    }
}

export enum ProviderType {
    ANIME = "ANIME",
    MANGA = "MANGA",
    META = "META",
    NONE = "NONE"
}

interface SentRequest {
    url: string;
    sent: number;
    options: Options;
    response: Response;
}

export type { SentRequest };