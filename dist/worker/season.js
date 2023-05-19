"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const queue_1 = __importDefault(require("../helper/queue"));
const season_1 = require("../lib/season");
const colors_1 = __importDefault(require("colors"));
const executor = new queue_1.default("season-executor")
    .executor(async (data) => {
    const media = await (0, season_1.loadSeasonal)(data);
    return media;
})
    .callback((id) => console.debug(colors_1.default.green(`Finished fetching seasonal data ${id.type}.`)))
    .error((err, id) => console.error(colors_1.default.red(`Error occurred while fetching seasonal data ${id.type}.`), err))
    .interval(1000);
exports.default = executor;
