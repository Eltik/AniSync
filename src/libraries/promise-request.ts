import fetch from "node-fetch";
import { pipeline } from 'node:stream';
import { promisify } from 'node:util';

export default class PromiseRequest {
    private url: string;
    private options: Options;

    constructor(url:string, options:Options) {
        this.url = url;
        this.options = options;
    }

    public async request(): Promise<Response> {
        return new Promise((resolve, reject) => {
            try {
                if (this.options.stream) {
                    throw new Error("Use the stream() function instead.");
                } else if (this.options.allowRedirect) {
                    fetch(this.url, {
                        ...this.options,
                        redirect: "follow"
                    }).then(async(response) => {
                        const request:Request = {
                            url: this.url,
                            options: this.options
                        };

                        let redirectUrl = this.url;
                        try {
                            redirectUrl = new URL(response.headers.get('location'), response.url).href;
                        } catch {
                            redirectUrl = this.url;
                        }

                        const text = await response.text();
                        let json = text;
                        try {
                            json = JSON.parse(text);
                        } catch {
                            json = {};
                        }
        
                        const res:Response = {
                            request,
                            status: response.status,
                            statusText: response.statusText,
                            url: redirectUrl,
                            error: [],
                            headers: response.headers,
                            raw: () => response,
                            text: () => text,
                            json: () => json
                        };
        
                        resolve(res);
                    }).catch((err) => {
                        console.error(err.message);
                    });
                } else {
                    fetch(this.url, {
                        ...this.options,
                    }).then(async(response) => {
                        const request:Request = {
                            url: this.url,
                            options: this.options
                        };
        
                        const text = await response.text();
                        let json = text;
                        try {
                            json = JSON.parse(text);
                        } catch {
                            json = {};
                        }
        
                        const res:Response = {
                            request,
                            status: response.status,
                            statusText: response.statusText,
                            url: this.url,
                            error: [],
                            headers: response.headers,
                            raw: () => response,
                            text: () => text,
                            json: () => json
                        };
        
                        resolve(res);
                    }).catch((err) => {
                        console.error(err.message);
                    });
                }
            } catch {
                console.error("Unable to send request.");
            }
        });
    }

    public async stream(stream) {
        return new Promise((resolve, reject) => {
            try {
                if (this.options.allowRedirect) {
                    fetch(this.url, {
                        ...this.options,
                        redirect: "follow"
                    }).then((response) => {
                        if (!response.ok) console.error(`unexpected response ${response.statusText}`);
                        const streamPipeline = promisify(pipeline);
                        streamPipeline(response.body, stream).then(() => {
                            resolve(true);
                        }).catch((err) => {
                            reject(err);
                        });
                    }).catch((err) => {
                        reject(err);
                    });
                } else {
                    fetch(this.url, {
                        ...this.options
                    }).then((response) => {
                        if (!response.ok) console.error(`unexpected response ${response.statusText}`);
                        const streamPipeline = promisify(pipeline);
                        streamPipeline(response.body, stream).then(() => {
                            resolve(true);
                        }).catch((err) => {
                            reject(err);
                        });
                    }).catch((err) => {
                        reject(err);
                    });
                }
            } catch {
                console.error("Error with streaming.");
            }
        })
    }
}

type Options = {
    method?: Method["GET"] | Method["POST"] | Method["COOKIE"] | Method["TOKENS"];
    headers?: { [key: string]: string };
    body?: string;
    allowRedirect?: boolean;
    stream?: boolean;
};

type Method = {
    "GET": string;
    "POST": string;
    "COOKIE": string;
    "TOKENS": string;
    
    // THE FOLLOWING ARE UNSUPPORTED TEMPORARILY
    "PUT": string;
    "DELETE": string;
    "PATCH": string;
    "HEAD": string;
};

interface Response {
    request: Request;
    status: number;
    statusText: string;
    url: string;
    error: string[];
    headers: { [key: string]: string }|Headers;
    raw: ()=>any;
    text: ()=>string;
    json: ()=>any;
};

interface Request {
    url: string;
    options: Options;
};

export type { Options, Method, Response, Request };