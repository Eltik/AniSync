"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Events = void 0;
const eventemitter2_1 = __importDefault(require("eventemitter2"));
var Events;
(function (Events) {
    Events["COMPLETED_MAPPING_LOAD"] = "mapping.load.completed";
    Events["COMPLETED_SEARCH_LOAD"] = "search.load.completed";
    Events["COMPLETED_SEASONAL_LOAD"] = "seasonal.load.completed";
    Events["COMPLETED_ENTRY_CREATION"] = "entry.creation.completed";
})(Events = exports.Events || (exports.Events = {}));
const emitter = new eventemitter2_1.default({});
exports.default = emitter;
