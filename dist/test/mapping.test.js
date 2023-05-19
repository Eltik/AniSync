"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
jest.setTimeout(120000);
const mappings_1 = require("../lib/mappings");
test("maps hyouka", async () => {
    const data = await (0, mappings_1.loadMapping)({ id: "12189", type: "ANIME" /* Type.ANIME */ });
    expect(data).not.toContain([]);
});
