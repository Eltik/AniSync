"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class InformationProvider {
    async search(query, type, formats) {
        return [];
    }
    async info(media) {
        return undefined;
    }
    get priorityArea() {
        return [];
    }
    get sharedArea() {
        return [];
    }
}
exports.default = InformationProvider;
