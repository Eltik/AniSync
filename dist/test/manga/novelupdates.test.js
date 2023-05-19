"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
jest.setTimeout(120000);
const mapping_1 = require("../../mapping");
const provider = mapping_1.MANGA_PROVIDERS[5];
test("returns a filled array of manga", async () => {
    const data = await provider.search("slime");
    expect(data).not.toBeUndefined();
    expect(data).not.toEqual([]);
    expect(data?.[0].id).not.toBeUndefined();
});
