import Fastify from "fastify";
import cors from '@fastify/cors';
import fastifyFormbody = require("@fastify/formbody");

import { config } from "./config";

import AniSync from "./AniSync";
import Anime from "./providers/anime/Anime";
import Manga from "./providers/manga/Manga";

const aniSync = new AniSync();
const anime = new Anime("", "");
const manga = new Manga("", "");

const fastify = Fastify({
    logger: false
});

const fastifyPlugins = [];

const corsPlugin = new Promise((resolve, reject) => {
    fastify.register(cors, {
        origin: config.web_server.cors,
        methods: ['POST', 'GET', 'PATCH', 'DELETE', 'OPTIONS'],
    }).then(() => {
        resolve(true);
    })
});

const formBody = new Promise((resolve, reject) => {
    fastify.register(fastifyFormbody).then(() => {
        resolve(true);
    })
})

fastifyPlugins.push(corsPlugin);
fastifyPlugins.push(formBody);

fastify.get("/", async(req, res) => {
    res.type("application/json").code(200);
    return { hello: "world" };
})

fastify.get("/popular/:type", async(req, res) => {
    const type = req.params["type"];

    if (!type) {
        res.type("application/json").code(400);
        return { error: "No amount or type provided." };
    }
    if (type.toLowerCase() === "manga") {
        const popular = await aniSync.getPopular("MANGA");

        manga.insert(popular);
        res.type("application/json").code(200);
        return popular;
    } else if (type.toLowerCase() === "anime") {
        const popular = await aniSync.getPopular("ANIME");

        anime.insert(popular);
        res.type("application/json").code(200);
        return popular;
    } else {
        res.type("application/json").code(404);
        return { error: "Unknown type." };
    }
})

fastify.post("/popular/:type", async(req, res) => {
    const type = req.params["type"];

    if (!type) {
        res.type("application/json").code(400);
        return { error: "No amount or type provided." };
    }
    if (type.toLowerCase() === "manga") {
        const popular = await aniSync.getPopular("MANGA");

        manga.insert(popular);
        res.type("application/json").code(200);
        return popular;
    } else if (type.toLowerCase() === "anime") {
        const popular = await aniSync.getPopular("ANIME");

        anime.insert(popular);
        res.type("application/json").code(200);
        return popular;
    } else {
        res.type("application/json").code(404);
        return { error: "Unknown type." };
    }
})

fastify.get("/seasonal/:type/:season", async(req, res) => {
    const type = req.params["type"];
    const season = req.params["season"];

    if (!season || !type) {
        res.type("application/json").code(400);
        return { error: "No amount or type provided." };
    }
    if (type.toLowerCase() === "anime") {
        if (season.toLowerCase() === "trending") {
            const data = await aniSync.getTrending("ANIME");
    
            anime.insert(data);
            res.type("application/json").code(200);
            return data;
        } else if (season.toLowerCase() === "season") {
            const data = await aniSync.getSeason("ANIME");
    
            anime.insert(data);
            res.type("application/json").code(200);
            return data;
        } else if (season.toLowerCase() === "next_season") {
            const data = await aniSync.getNextSeason("ANIME");
    
            anime.insert(data);
            res.type("application/json").code(200);
            return data;
        } else if (season.toLowerCase() === "popular") {
            const data = await aniSync.getPopular("ANIME");
    
            anime.insert(data);
            res.type("application/json").code(200);
            return data;
        } else if (season.toLowerCase() === "top") {
            const data = await aniSync.getTop("ANIME");
    
            anime.insert(data);
            res.type("application/json").code(200);
            return data;
        } else {
            res.type("application/json").code(404);
            return { error: "Unknown seasonal type." };
        }
    } else if (type.toLowerCase() === "manga") {
        if (season.toLowerCase() === "trending") {
            const data = await aniSync.getTrending("MANGA");
    
            manga.insert(data);
            res.type("application/json").code(200);
            return data;
        } else if (season.toLowerCase() === "season") {
            const data = await aniSync.getSeason("MANGA");
    
            manga.insert(data);
            res.type("application/json").code(200);
            return data;
        } else if (season.toLowerCase() === "next_season") {
            const data = await aniSync.getNextSeason("MANGA");
    
            manga.insert(data);
            res.type("application/json").code(200);
            return data;
        } else if (season.toLowerCase() === "popular") {
            const data = await aniSync.getPopular("MANGA");
    
            manga.insert(data);
            res.type("application/json").code(200);
            return data;
        } else if (season.toLowerCase() === "top") {
            const data = await aniSync.getTop("MANGA");
    
            manga.insert(data);
            res.type("application/json").code(200);
            return data;
        } else {
            res.type("application/json").code(404);
            return { error: "Unknown seasonal type." };
        }
    } else {
        res.type("application/json").code(404);
        return { error: "Unknown type." };
    }
})

fastify.post("/seasonal/:type", async(req, res) => {
    const season = req.body["season"];
    const type = req.params["type"];
    
    if (!season || !type) {
        res.type("application/json").code(400);
        return { error: "No amount or type provided." };
    }
    if (type.toLowerCase() === "anime") {
        if (season.toLowerCase() === "trending") {
            const data = await aniSync.getTrending("ANIME");
    
            anime.insert(data);
            res.type("application/json").code(200);
            return data;
        } else if (season.toLowerCase() === "season") {
            const data = await aniSync.getSeason("ANIME");
    
            anime.insert(data);
            res.type("application/json").code(200);
            return data;
        } else if (season.toLowerCase() === "next_season") {
            const data = await aniSync.getNextSeason("ANIME");
    
            anime.insert(data);
            res.type("application/json").code(200);
            return data;
        } else if (season.toLowerCase() === "popular") {
            const data = await aniSync.getPopular("ANIME");
    
            anime.insert(data);
            res.type("application/json").code(200);
            return data;
        } else if (season.toLowerCase() === "top") {
            const data = await aniSync.getTop("ANIME");
    
            anime.insert(data);
            res.type("application/json").code(200);
            return data;
        } else {
            res.type("application/json").code(404);
            return { error: "Unknown seasonal type." };
        }
    } else if (type.toLowerCase() === "manga") {
        if (season.toLowerCase() === "trending") {
            const data = await aniSync.getTrending("MANGA");
    
            manga.insert(data);
            res.type("application/json").code(200);
            return data;
        } else if (season.toLowerCase() === "season") {
            const data = await aniSync.getSeason("MANGA");
    
            manga.insert(data);
            res.type("application/json").code(200);
            return data;
        } else if (season.toLowerCase() === "next_season") {
            const data = await aniSync.getNextSeason("MANGA");
    
            manga.insert(data);
            res.type("application/json").code(200);
            return data;
        } else if (season.toLowerCase() === "popular") {
            const data = await aniSync.getPopular("MANGA");
    
            manga.insert(data);
            res.type("application/json").code(200);
            return data;
        } else if (season.toLowerCase() === "top") {
            const data = await aniSync.getTop("MANGA");
    
            manga.insert(data);
            res.type("application/json").code(200);
            return data;
        } else {
            res.type("application/json").code(404);
            return { error: "Unknown seasonal type." };
        }
    } else {
        res.type("application/json").code(404);
        return { error: "Unknown type." };
    }
})

fastify.get("/latest/:type", async(req, res) => {
    const type = req.params["type"];
    res.type("application/josn").code(500);
    return { error: "Method not implemented yet." };
})

fastify.post("/latest/:type", async(req, res) => {
    const type = req.params["type"];
    res.type("application/josn").code(500);
    return { error: "Method not implemented yet." };
})

fastify.get("/search/:type/:query", async(req, res) => {
    const query = req.params["query"];
    const type = req.params["type"];

    if (!query || !type) {
        res.type("application/json").code(400);
        return { error: "No query or type provided." };
    }
    if (type.toLowerCase() === "manga") {
        const result = await aniSync.search(query, "MANGA");

        res.type("application/json").code(200);
        return result;
    } else if (type.toLowerCase() === "anime") {
        const result = await aniSync.search(query, "ANIME");

        res.type("application/json").code(200);
        return result;
    } else {
        res.type("application/json").code(400);
        return { error: "Unknown type for the given type of " + type + "." };
    }
})

fastify.post("/search/:type", async(req, res) => {
    const query = req.body["query"];
    const type = req.params["type"];

    if (!query || !type) {
        res.type("application/json").code(400);
        return { error: "No query or type provided." };
    }
    if (type.toLowerCase() === "manga") {
        const result = await aniSync.search(query, "MANGA");

        res.type("application/json").code(200);
        return result;
    } else if (type.toLowerCase() === "anime") {
        const result = await aniSync.search(query, "ANIME");

        res.type("application/json").code(200);
        return result;
    } else {
        res.type("application/json").code(400);
        return { error: "Unknown type for the given type of " + type + "." };
    }
})

fastify.post("/cached/:id", async(req, res) => {
    const id = req.body["id"]
    const type = req.params["type"];

    if (!id || !type) {
        res.type("application/json").code(400);
        return { error: "Invalid request!" };
    }
    res.type("application/json").code(500);
    return { error: "Method not implemented yet." };
})

fastify.get("/info/:id", async(req, res) => {
    const id = req.params["id"]

    if (!id) {
        res.type("application/json").code(400);
        return { error: "Invalid request!" };
    }

    const data = await aniSync.get(id);
    if (!data) {
        res.type("application/json").code(404);
        return { error: "Not found" };
    }
    res.type("application/json").code(200);
    return data;
})

fastify.post("/info", async(req, res) => {
    const id = req.body["id"]

    if (!id) {
        res.type("application/json").code(400);
        return { error: "Invalid request!" };
    }

    const data = await aniSync.get(id);
    if (!data) {
        res.type("application/json").code(404);
        return { error: "Not found" };
    }
    res.type("application/json").code(200);
    return data;
})

Promise.all(fastifyPlugins).then(() => {
    fastify.listen({ port: config.web_server.port }, (err, address) => {
        if (err) throw err;
        console.log(`Listening to ${address}.`);
        // Server is now listening on ${address}
    })
})