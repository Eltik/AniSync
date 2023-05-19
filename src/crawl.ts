import dotenv from "dotenv";
dotenv.config();

import axios from "axios";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { Type } from "./mapping";

import colors from "colors";
import { prisma } from "./database";
import AniList from "./mapping/impl/information/anilist";
import { loadMapping } from "./lib/mappings";

import queues from "./worker";
import emitter, { Events } from "@/src/helper/event";

const type: Type = Type.ANIME;
let maxIds = 0;

emitter.on(Events.COMPLETED_MAPPING_LOAD, (data) => {
    for (let i = 0; i < data.length; i++) {
        queues.createEntry.add({ toInsert: data[i], type: data[i].type });
    }
});

queues.mappingQueue.start();
queues.createEntry.start();

(async () => {
    const aniList = new AniList();

    const ids: string[] = type === Type.ANIME ? await getAnimeIDs() : await getMangaIDs();

    maxIds = maxIds ? maxIds : ids.length;

    let lastId = 0;

    try {
        const lastIdString = readFileSync("lastId.txt", "utf8");
        lastId = isNaN(parseInt(lastIdString)) ? 0 : parseInt(lastIdString);
    } catch (err) {
        if (!existsSync("lastId.txt")) {
            console.log(colors.yellow("lastId.txt does not exist. Creating..."));
            writeFileSync("lastId.txt", "0");
            console.log(colors.green("Created lastId.txt"));
        } else {
            console.log(colors.red("Could not read lastId.txt"));
        }
    }

    for (let i = lastId; i < ids.length && i < maxIds; i++) {
        if (i >= maxIds) {
            break;
        }
        const possible =
            type === Type.ANIME
                ? await prisma.anime.findFirst({
                      where: {
                          id: {
                              equals: ids[i],
                          },
                      },
                  })
                : await prisma.manga.findFirst({
                      where: {
                          id: {
                              equals: ids[i],
                          },
                      },
                  });

        if (!possible) {
            const start = new Date(Date.now());

            const data = await aniList.getMedia(ids[i]).catch((err) => {
                console.log(colors.red("Error fetching ID: ") + colors.white(ids[i] + ""));
                return null;
            });
            if (data) {
                await loadMapping({ id: ids[i], type: type });
            }
            const end = new Date(Date.now());
            console.log(colors.gray("Finished fetching data. Request(s) took ") + colors.cyan(String(end.getTime() - start.getTime())) + colors.gray(" milliseconds."));
            console.log(colors.green("Fetched ID ") + colors.blue("#" + (i + 1) + "/" + maxIds));

            writeFileSync("lastId.txt", i.toString());
        }
    }

    console.log(colors.green("Crawling finished."));
})();

async function getAnimeIDs(): Promise<string[]> {
    const req1 = await axios("https://anilist.co/sitemap/anime-0.xml");
    const data1 = await req1.data;
    const req2 = await axios("https://anilist.co/sitemap/anime-1.xml");
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
async function getMangaIDs(): Promise<string[]> {
    const req1 = await axios("https://anilist.co/sitemap/manga-0.xml");
    const data1 = await req1.data;
    const req2 = await axios("https://anilist.co/sitemap/manga-1.xml");
    const data2 = await req2.data;

    const ids1 = data1.match(/manga\/([0-9]+)/g).map((id) => {
        return id.replace("manga/", "");
    });

    const ids2 = data2.match(/manga\/([0-9]+)/g).map((id) => {
        return id.replace("manga/", "");
    });
    return ids1.concat(ids2);
}
