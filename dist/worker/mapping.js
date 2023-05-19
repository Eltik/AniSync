"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const queue_1 = __importDefault(require("../helper/queue"));
const mappings_1 = require("../lib/mappings");
const colors_1 = __importDefault(require("colors"));
const executor = new queue_1.default("mapping-executor")
    .executor(async (data) => {
    const media = await (0, mappings_1.loadMapping)(data);
    return media;
})
    .callback((id) => console.debug(colors_1.default.green(`Finished mapping for media ${id.id}`)))
    .error((err, id) => console.error(colors_1.default.red(`Error occurred while mapping for media ${id.id}`), err))
    .interval(1000);
exports.default = executor;
