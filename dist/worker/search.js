"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const queue_1 = __importDefault(require("@/src/helper/queue"));
const search_1 = require("../lib/search");
const colors_1 = __importDefault(require("colors"));
const executor = new queue_1.default("search-executor")
    .executor(async (data) => {
    const media = await (0, search_1.loadSearch)(data);
    return media;
})
    .callback(id => console.debug(colors_1.default.green(`Finished searching for media ${id.query} via the database/AniList.`)))
    .error((err, id) => console.error(colors_1.default.red(`Error occurred while searching for media via the database/AniList ${id.query}`), err))
    .interval(1000);
exports.default = executor;
