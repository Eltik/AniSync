"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const promise_request_1 = require("./libraries/promise-request");
const cheerio_1 = require("cheerio");
class API {
    constructor() {
        this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36';
    }
    async fetchJSON(url, options) {
        const request = new promise_request_1.default(url, {
            ...options,
            headers: {
                ...options?.headers,
                'User-Agent': this.userAgent
            }
        });
        const data = await request.request();
        return data;
    }
    async fetchDOM(url, selector, options) {
        const request = new promise_request_1.default(url, {
            ...options,
            headers: {
                ...options?.headers,
                'User-Agent': this.userAgent
            }
        });
        const data = await request.request();
        if (!data.text()) {
            throw new Error("Couldn't fetch data.");
        }
        const $ = (0, cheerio_1.load)(data.text());
        const result = $(selector);
        const dom = {
            Response: data,
            Cheerio: result
        };
        return dom;
    }
    async stream(url, stream, options) {
        const request = new promise_request_1.default(url, {
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
    async wait(time) {
        return new Promise(resolve => {
            setTimeout(resolve, time);
        });
    }
    getRandomInt(max) {
        return Math.floor(Math.random() * max);
    }
    makeId(length) {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() *
                charactersLength));
        }
        return result;
    }
    stringSearch(string, pattern) {
        let count = 0;
        string = string.toLowerCase();
        pattern = pattern.toLowerCase();
        string = string.replace(/[^a-zA-Z0-9 -]/g, "");
        pattern = pattern.replace(/[^a-zA-Z0-9 -]/g, "");
        for (let i = 0; i < string.length; i++) {
            for (let j = 0; j < pattern.length; j++) {
                if (pattern[j] !== string[i + j])
                    break;
                if (j === pattern.length - 1)
                    count++;
            }
        }
        return count;
    }
}
exports.default = API;
//# sourceMappingURL=API.js.map