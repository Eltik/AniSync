"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = require("node-fetch");
const node_stream_1 = require("node:stream");
const node_util_1 = require("node:util");
class PromiseRequest {
    constructor(url, options) {
        this.url = url;
        this.options = options;
    }
    async request() {
        return new Promise((resolve, reject) => {
            try {
                if (this.options.stream) {
                    throw new Error("Use the stream() function instead.");
                }
                else if (this.options.allowRedirect) {
                    (0, node_fetch_1.default)(this.url, {
                        ...this.options,
                        redirect: "follow"
                    }).then(async (response) => {
                        const request = {
                            url: this.url,
                            options: this.options
                        };
                        let redirectUrl = this.url;
                        try {
                            redirectUrl = new URL(response.headers.get('location'), response.url).href;
                        }
                        catch {
                            redirectUrl = this.url;
                        }
                        const text = await response.text();
                        let json = text;
                        try {
                            json = JSON.parse(text);
                        }
                        catch {
                            json = {};
                        }
                        const res = {
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
                }
                else {
                    (0, node_fetch_1.default)(this.url, {
                        ...this.options,
                    }).then(async (response) => {
                        const request = {
                            url: this.url,
                            options: this.options
                        };
                        const text = await response.text();
                        let json = text;
                        try {
                            json = JSON.parse(text);
                        }
                        catch {
                            json = {};
                        }
                        const res = {
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
            }
            catch {
                console.error("Unable to send request.");
            }
        });
    }
    async stream(stream) {
        return new Promise((resolve, reject) => {
            try {
                if (this.options.allowRedirect) {
                    (0, node_fetch_1.default)(this.url, {
                        ...this.options,
                        redirect: "follow"
                    }).then((response) => {
                        if (!response.ok)
                            console.error(`unexpected response ${response.statusText}`);
                        const streamPipeline = (0, node_util_1.promisify)(node_stream_1.pipeline);
                        streamPipeline(response.body, stream).then(() => {
                            resolve(true);
                        }).catch((err) => {
                            reject(err);
                        });
                    }).catch((err) => {
                        reject(err);
                    });
                }
                else {
                    (0, node_fetch_1.default)(this.url, {
                        ...this.options
                    }).then((response) => {
                        if (!response.ok)
                            console.error(`unexpected response ${response.statusText}`);
                        const streamPipeline = (0, node_util_1.promisify)(node_stream_1.pipeline);
                        streamPipeline(response.body, stream).then(() => {
                            resolve(true);
                        }).catch((err) => {
                            reject(err);
                        });
                    }).catch((err) => {
                        reject(err);
                    });
                }
            }
            catch {
                console.error("Error with streaming.");
            }
        });
    }
}
exports.default = PromiseRequest;
;
;
//# sourceMappingURL=promise-request.js.map