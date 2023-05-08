import dotenv from 'dotenv';
dotenv.config();

import queues from './worker';
import emitter, { Events } from '@/src/helper/event';
import { start } from './server';
import { prisma } from './database';
import { MediaStatus } from './mapping';

emitter.on(Events.COMPLETED_SEASONAL_LOAD, async(data) => {
    for (let i = 0; i < data.trending.length; i++) {
        if (data.trending[i].status === MediaStatus.NOT_YET_RELEASED) {
            continue;
        }
        const existing = data.trending[i].type === "ANIME" ? await prisma.anime.findFirst({
            where: {
                id: String(data.trending[i].aniListId)
            }
        }) : await prisma.manga.findFirst({
            where: {
                id: String(data.trending[i].aniListId)
            }
        })
        if (!existing) {
            queues.mappingQueue.add({ id: data.trending[i].aniListId, type: data.trending[i].type })
        }
    }

    for (let i = 0; i < data.popular.length; i++) {
        if (data.popular[i].status === MediaStatus.NOT_YET_RELEASED) {
            continue;
        }
        const existing = data.popular[i].type === "ANIME" ? await prisma.anime.findFirst({
            where: {
                id: String(data.popular[i].aniListId)
            }
        }) : await prisma.manga.findFirst({
            where: {
                id: String(data.popular[i].aniListId)
            }
        })
        if (!existing) queues.mappingQueue.add({ id: data.popular[i].aniListId, type: data.popular[i].type })
    }

    for (let i = 0; i < data.top.length; i++) {
        if (data.top[i].status === MediaStatus.NOT_YET_RELEASED) {
            continue;
        }
        const existing = data.top[i].type === "ANIME" ? await prisma.anime.findFirst({
            where: {
                id: String(data.top[i].aniListId)
            }
        }) : await prisma.manga.findFirst({
            where: {
                id: String(data.top[i].aniListId)
            }
        })
        if (!existing) queues.mappingQueue.add({ id: data.top[i].aniListId, type: data.top[i].type })
    }

    for (let i = 0; i < data.seasonal.length; i++) {
        if (data.seasonal[i].status === MediaStatus.NOT_YET_RELEASED) {
            continue;
        }
        const existing = data.seasonal[i].type === "ANIME" ? await prisma.anime.findFirst({
            where: {
                id: String(data.seasonal[i].aniListId)
            }
        }) : await prisma.manga.findFirst({
            where: {
                id: String(data.seasonal[i].aniListId)
            }
        })
        if (!existing) queues.mappingQueue.add({ id: data.seasonal[i].aniListId, type: data.seasonal[i].type })
    }
});

emitter.on(Events.COMPLETED_MAPPING_LOAD, (data) => {
    for (let i = 0; i < data.length; i++) {
        queues.createEntry.add({ toInsert: data[i], type: data[i].type })
    }
});

emitter.on(Events.COMPLETED_SEARCH_LOAD, (data) => {
    if (data[0].aniListId) {
        for (let i = 0; i < data.length; i++) {
            if (data[i].status === MediaStatus.NOT_YET_RELEASED) {
                continue;
            }
            queues.mappingQueue.add({ id: data[i].aniListId, type: data[i].type })
        }
    }
});

queues.seasonQueue.start();
queues.mappingQueue.start();
queues.createEntry.start();
queues.searchQueue.start();

start();