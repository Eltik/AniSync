"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const queue_1 = __importDefault(require("../helper/queue"));
const entry_1 = require("../lib/entry");
const colors_1 = __importDefault(require("colors"));
const executor = new queue_1.default("entry-executor")
    .executor(async (data) => {
    const media = await (0, entry_1.createEntry)(data);
    return media;
})
    .callback((id) => console.debug(colors_1.default.green(`Finished creating entry for media ${id.toInsert.title.english ?? id.toInsert.title.romaji ?? id.toInsert.title.native}`)))
    .error((err, id) => console.error(colors_1.default.red(`Error occurred while creating entry for media ${id.toInsert.title.english ?? id.toInsert.title.romaji ?? id.toInsert.title.native}`), err))
    .interval(500);
exports.default = executor;
