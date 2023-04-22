import Core from "../Core";

const { parentPort } = require('node:worker_threads');

parentPort.on("message", async message => {
    // @ts-ignore
    if (!message.response) {
        const core = new Core(message.options);
        const data = await core.searchAccurate(message.query, message.type, message.format);
        parentPort.postMessage({
            data,
            query: message.query,
            type: message.type,
            format: message.format
        });
    }
});