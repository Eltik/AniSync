"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadSearch = void 0;
const event_1 = __importStar(require("../helper/event"));
const anilist_1 = __importDefault(require("../mapping/impl/information/anilist"));
const database_1 = require("../database");
const loadSearch = async (data) => {
    // First check if exists in database
    const existing = await (0, database_1.search)(data.query, data.type, data.formats, 1, 15);
    if (existing.length > 0) {
        await event_1.default.emitAsync(event_1.Events.COMPLETED_SEARCH_LOAD, existing);
        return existing;
    }
    const result = await new anilist_1.default().search(data.query, data.type, data.formats, 0, 1);
    await event_1.default.emitAsync(event_1.Events.COMPLETED_SEARCH_LOAD, result);
    return result;
};
exports.loadSearch = loadSearch;
