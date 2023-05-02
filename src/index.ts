import dotenv from 'dotenv';
dotenv.config();

import queues from './worker';
import emitter, { Events } from '@/src/helper/event';
import { start } from './server';

emitter.on(Events.COMPLETED_SEASONAL_LOAD, (data) => {
    for (let i = 0; i < data.trending.length; i++) {
        queues.mappingQueue.add({ id: data.trending[i].aniListId, type: data.trending[i].type })
    }

    for (let i = 0; i < data.popular.length; i++) {
        queues.mappingQueue.add({ id: data.popular[i].aniListId, type: data.popular[i].type })
    }

    for (let i = 0; i < data.top.length; i++) {
        queues.mappingQueue.add({ id: data.top[i].aniListId, type: data.top[i].type })
    }

    for (let i = 0; i < data.seasonal.length; i++) {
        queues.mappingQueue.add({ id: data.seasonal[i].aniListId, type: data.seasonal[i].type })
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
            queues.mappingQueue.add({ id: data[i].aniListId, type: data[i].type })
        }
    }
});

queues.seasonQueue.start();
queues.mappingQueue.start();
queues.createEntry.start();
queues.searchQueue.start();

start();