import axios from "axios";
import { AxiosProxyConfig } from "axios";
import { pipeline } from 'node:stream';
import { promisify } from 'node:util';
import CF from "cfbypass";
import { load } from "cheerio";

export default class PromiseRequest {
    private url: string;
    private options: Options;
    private cfbypass = new CF((process.env.IS_PYTHON3?.toLowerCase() == "true" ? true : false) || false);

    constructor(url:string, options:Options) {
        this.url = url;
        this.options = options;
    }

    public async request(): Promise<Response> {
        return new Promise(async(resolve, reject) => {
            try {
                if (this.options.stream) {
                    throw new Error("Use the stream() function instead.");
                } else {
                    let options:any = {
                        ...this.options,
                    };
                    if (options.body != undefined) {
                        options = {
                            ...options,
                            data: this.options.body
                        }
                    }
                    if (options.responseType != undefined) {
                        options = {
                            ...options,
                            responseType: this.options.responseType
                        }
                    }

                    if (options.bypassWaf) {
                        const userAgent = (options.headers.userAgent || options.headers["User-Agent"] || options.headers["user-agent"] || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");
                        const token = await this.tokenGen("d72d187df41e10ea7d9fcdc7f5909205", userAgent);
                        
                        let canFetch = true;
                        if (!token) {
                            canFetch = false;
                        }

                        if (canFetch) {
                            const fetchKey = axios.get(`${process.env.NINEANIME || "https://9anime.pl"}/?__jscheck=${token}`, {
                                headers: {
                                    "User-Agent": userAgent,
                                },
                            });
    
                            const response = await fetchKey;
    
                            let cookie:any = response.headers["set-cookie"];
                            if (!cookie) return console.log("No cookie found");
                            else cookie = cookie[0].split(";")[0];
    
                            options.headers.cookie = cookie;
                            options.headers.userAgent = userAgent;
                        }
                    }

                    if (options.useCFBypass) {
                        this.cfbypass.request({
                            url: this.url,
                            options: {
                                body: options.body,
                                headers: options.headers,
                                method: options.method
                            }
                        }).then((response) => {
                            const request:Request = {
                                url: this.url,
                                options: this.options
                            };
    
                            let redirectUrl = this.url;
    
                            const text = response.text();
                            let json = "";
                            try {
                                json = JSON.parse(response.json());
                            } catch {
                                json = response.text();
                            }
    
                            const stringified = `Status: ${response.status} ${response.statusText}\nURL: ${this.url}\nHeaders: ${JSON.stringify({})}\nBody: ${JSON.stringify(text)}`;
            
                            const res:Response = {
                                request,
                                status: response.status,
                                statusText: response.statusText,
                                url: redirectUrl,
                                error: [],
                                headers: {},
                                toString: () => stringified,
                                raw: () => response,
                                text: () => text,
                                json: () => json
                            };
            
                            resolve(res);
                        }).catch((err) => {
                            reject(err);
                        });
                    } else {
                        axios(this.url, options).then(async(response) => {
                            const request:Request = {
                                url: this.url,
                                options: this.options
                            };
    
                            let redirectUrl = this.url;
                            try {
                                redirectUrl = new URL(response.request.responseURL).href;
                            } catch {
                                redirectUrl = this.url;
                            }
    
                            const text = response.data;
                            let json = response.data;
                            try {
                                json = JSON.parse(response.data);
                            } catch {
                                json = response.data;
                            }
    
                            const stringified = `Status: ${response.status} ${response.statusText}\nURL: ${this.url}\nHeaders: ${JSON.stringify(response.headers)}\nBody: ${JSON.stringify(text)}`;
            
                            const res:Response = {
                                request,
                                status: response.status,
                                statusText: response.statusText,
                                url: redirectUrl,
                                error: [],
                                headers: response.headers,
                                toString: () => stringified,
                                raw: () => response,
                                text: () => text,
                                json: () => json
                            };
            
                            resolve(res);
                        }).catch((err) => {
                            reject(err);
                        });
                    }
                }
            } catch (e) {
                throw new Error(e);
            }
        });
    }

    public async stream(stream) {
        return new Promise((resolve, reject) => {
            try {
                let options:any = {
                    ...this.options,
                };
                if (options.body != undefined) {
                    options = {
                        ...options,
                        data: this.options.body
                    }
                }
                axios(this.url, {
                    ...this.options,
                    responseType: "stream"
                }).then((response) => {
                    if (response.statusText != "OK") console.error(`unexpected response ${response.statusText}`);
                    const streamPipeline = promisify(pipeline);
                    streamPipeline(response.data, stream).then(() => {
                        resolve(true);
                    }).catch((err) => {
                        reject(err);
                    });
                }).catch((err) => {
                    reject(err);
                });
            } catch {
                console.error("Error with streaming.");
            }
        })
    }


    /**
     * @author TDanks2000
     * @param {string} key
     * @returns {Promise<string>}
     * @description Generates token for 9anime.to
     *
     * the key is from https://9anime.to/waf-js-run after evaling the page
     * the key is then gotten from var k = "<KEY>"
     */
     private async tokenGen(key:string, userAgent:string) {
        const url = process.env.NINEANIME || "https://9anime.pl";

        const { data } = await axios.get(url, {
            headers: {
                "User-Agent": userAgent,
            },
        });
    
        const $ = load(data);
        // Check if the page is blocked
        if ($("#__jscheck").length == 0) return null;
    
        const _a = data.split("_a = '")[1].split("',")[0];
        const _b = data.split("_b = '")[1].split("';")[0];
    
        if (!_a && !_b) return null;
    
        var k = key, l = k.length, u = "undefined", i, o = "";
    
        if (typeof _a == u || typeof _b == u) return;
        if (l != _a.length || l != _b.length) return;
    
        for (i = 0; i < l; i++) o += k[i] + _a[i] + _b[i];
    
        return o;
    }
}

type Options = {
    method?: string;
    headers?: { [key: string]: string };
    body?: string|URLSearchParams|FormData|any;
    maxRedirects?: number;
    stream?: boolean;
    responseType?: string;
    proxy?: AxiosProxyConfig | false;
    httpsAgent?: any;
    useCFBypass?: boolean;
    bypassWaf?: boolean;
};

interface Response {
    request: Request;
    status: number;
    statusText: string;
    url: string;
    error: string[];
    headers: { [key: string]: string }|Headers;
    toString: ()=>string;
    raw: ()=>any;
    text: ()=>string;
    json: ()=>any;
};

interface Request {
    url: string;
    options: Options;
};

export type { Options, Response, Request };