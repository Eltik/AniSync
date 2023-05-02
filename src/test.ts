import dotenv from "dotenv";
dotenv.config();

import axios from "axios";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { Format, Type } from "./mapping";

import colors from "colors";
import { prisma } from "./database";
import AniList from "./mapping/impl/information/anilist";
import { loadMapping } from "./lib/mappings";

import queues from './worker';
import emitter, { Events } from '@/src/helper/event';

// CONFIGURE THINGS HERE
const type: Type = Type.ANIME;
let maxIds: number = 0;

emitter.on(Events.COMPLETED_MAPPING_LOAD, (data) => {
    for (let i = 0; i < data.length; i++) {
        queues.createEntry.add({ toInsert: data[i], type: data[i].type })
    }
});

queues.mappingQueue.start();
queues.createEntry.start();

loadMapping({ id: "141534", type: Type.ANIME }).then(console.log)