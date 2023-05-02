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
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const axios_1 = __importDefault(require("axios"));
const fs_1 = require("fs");
const colors_1 = __importDefault(require("colors"));
const database_1 = require("./database");
const anilist_1 = __importDefault(require("./mapping/impl/information/anilist"));
const mappings_1 = require("./lib/mappings");
const worker_1 = __importDefault(require("./worker"));
const event_1 = __importStar(require("@/src/helper/event"));
const type = "ANIME" /* Type.ANIME */;
let maxIds = 0;
event_1.default.on(event_1.Events.COMPLETED_MAPPING_LOAD, (data) => {
    for (let i = 0; i < data.length; i++) {
        worker_1.default.createEntry.add({ toInsert: data[i], type: data[i].type });
    }
});
worker_1.default.mappingQueue.start();
worker_1.default.createEntry.start();
(async () => {
    const aniList = new anilist_1.default();
    const ids = type === "ANIME" /* Type.ANIME */ ? await getAnimeIDs() : await getMangaIDs();
    maxIds = maxIds ? maxIds : ids.length;
    let lastId = 0;
    try {
        let lastIdString = (0, fs_1.readFileSync)("lastId.txt", "utf8");
        lastId = isNaN(parseInt(lastIdString)) ? 0 : parseInt(lastIdString);
    }
    catch (err) {
        if (!(0, fs_1.existsSync)("lastId.txt")) {
            console.log(colors_1.default.yellow("lastId.txt does not exist. Creating..."));
            (0, fs_1.writeFileSync)("lastId.txt", "0");
            console.log(colors_1.default.green("Created lastId.txt"));
        }
        else {
            console.log(colors_1.default.red("Could not read lastId.txt"));
        }
    }
    for (let i = lastId; i < ids.length && i < maxIds; i++) {
        if (i >= maxIds) {
            break;
        }
        const possible = type === "ANIME" /* Type.ANIME */ ?
            await database_1.prisma.anime.findFirst({
                where: {
                    id: {
                        equals: ids[i]
                    }
                }
            }) :
            await database_1.prisma.manga.findFirst({
                where: {
                    id: {
                        equals: ids[i]
                    }
                }
            });
        if (!possible) {
            const start = new Date(Date.now());
            const data = await aniList.getMedia(ids[i]).catch((err) => {
                console.log(colors_1.default.red("Error fetching ID: ") + colors_1.default.white(ids[i] + ""));
                return null;
            });
            if (data) {
                await (0, mappings_1.loadMapping)({ id: ids[i], type: type });
            }
            const end = new Date(Date.now());
            console.log(colors_1.default.gray("Finished fetching data. Request(s) took ") + colors_1.default.cyan(String(end.getTime() - start.getTime())) + colors_1.default.gray(" milliseconds."));
            console.log(colors_1.default.green("Fetched ID ") + colors_1.default.blue("#" + (i + 1) + "/" + maxIds));
            (0, fs_1.writeFileSync)("lastId.txt", i.toString());
        }
    }
    console.log(colors_1.default.green("Crawling finished."));
})();
async function getAnimeIDs() {
    const req1 = await (0, axios_1.default)("https://anilist.co/sitemap/anime-0.xml");
    const data1 = await req1.data;
    const req2 = await (0, axios_1.default)("https://anilist.co/sitemap/anime-1.xml");
    const data2 = await req2.data;
    const ids1 = data1.match(/anime\/([0-9]+)/g).map((id) => {
        return id.replace("anime/", "");
    });
    const ids2 = data2.match(/anime\/([0-9]+)/g).map((id) => {
        return id.replace("anime/", "");
    });
    return ids1.concat(ids2);
}
/**
 * @description Fetches all manga AniList ID's from AniList's sitemap
 * @returns Promise<string[]>
 */
async function getMangaIDs() {
    const req1 = await (0, axios_1.default)("https://anilist.co/sitemap/manga-0.xml");
    const data1 = await req1.data;
    const req2 = await (0, axios_1.default)("https://anilist.co/sitemap/manga-1.xml");
    const data2 = await req2.data;
    const ids1 = data1.match(/manga\/([0-9]+)/g).map((id) => {
        return id.replace("manga/", "");
    });
    const ids2 = data2.match(/manga\/([0-9]+)/g).map((id) => {
        return id.replace("manga/", "");
    });
    return ids1.concat(ids2);
}
