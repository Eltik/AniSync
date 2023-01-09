"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const API_1 = require("../../API");
class Meta extends API_1.default {
    constructor(baseUrl, providerName) {
        super();
        this.baseUrl = undefined;
        this.providerName = undefined;
        this.baseUrl = baseUrl;
        this.providerName = providerName;
    }
    async search(any) {
        throw new Error("Method not implemented.");
    }
}
exports.default = Meta;
//# sourceMappingURL=Meta.js.map