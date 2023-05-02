import Fastify from "fastify";
import Redis from "ioredis";

import colors from "colors";

import queues from './worker';
import { Format } from "./mapping";
import { info, search, seasonal } from "./database";
import { loadSeasonal } from "./lib/season";

const port = parseInt(process.env.PORT as string) || 3000;

const fastify = Fastify();

const redis = new Redis(process.env.REDIS_URL as string || "redis://localhost:6379");
const cacheTime = process.env.REDIS_CACHE_TIME as string || 60 * 60 * 24 * 7;

fastify.get("/", async (request, reply) => {
    return { hello: "world" }
})

fastify.get("/search/:type/:query", async (request, reply) => {
    let { type, query } = request.params as any;

    const validTypes = ["anime", "manga", "novel"];
    if (!validTypes.includes(type.toLowerCase())) {
        return reply.code(400).send({ error: "Invalid type" });
    }

    if (!query || query.length < 3) {
        return reply.code(400).send({ error: "Invalid query" });
    }
    
    const formats = type.toLowerCase() === "anime" ? [Format.MOVIE, Format.TV, Format.TV_SHORT, Format.OVA, Format.ONA, Format.OVA] :
                type.toLowerCase() === "manga" ? [Format.MANGA, Format.ONE_SHOT] :
                [Format.NOVEL];

    const originalType = type;

    if (type.toLowerCase().includes("novel")) {
        type = "manga";
    }

    const cached = await redis.get(`search:${originalType}:${query}`);
    if (cached) {
        return JSON.parse(cached);
    }

    const existing = await search(query, type.toUpperCase(), formats, 0, 20);
    if (existing.length === 0) {
        queues.searchQueue.add({ type: type.toUpperCase(), query: query, formats: formats });

        await redis.set(`search:${originalType}:${query}`, JSON.stringify(existing), "EX", cacheTime);

        return [];
    } else {
        await redis.set(`search:${originalType}:${query}`, JSON.stringify(existing), "EX", cacheTime);

        return existing;   
    }
});

fastify.post("/search", async (request, reply) => {
    let { type, query } = request.body as any;

    if (!type || (type.toLowerCase() !== "anime" && type.toLowerCase() !== "manga") && type.toLowerCase() !== "novel") {
        return reply.code(400).send({ error: "Invalid type" });
    }

    if (!query || query.length < 3) {
        return reply.code(400).send({ error: "Invalid query" });
    }

    const originalType = type;

    if (type.toLowerCase().includes("novel")) {
        type = "manga";
    }

    const cached = await redis.get(`search:${originalType}:${query}`);
    if (cached) {
        return JSON.parse(cached);
    }
    
    const formats = type.toLowerCase() === "anime" ? [Format.MOVIE, Format.TV, Format.TV_SHORT, Format.OVA, Format.ONA, Format.OVA] :
                type.toLowerCase() === "manga" ? [Format.MANGA, Format.ONE_SHOT] :
                [Format.NOVEL];

    const existing = await search(query, type.toUpperCase(), formats, 0, 20);
    if (existing.length === 0) {
        queues.searchQueue.add({ type: type.toUpperCase(), query: query, formats: formats });

        await redis.set(`search:${originalType}:${query}`, JSON.stringify(existing), "EX", cacheTime);

        return [];
    } else {
        await redis.set(`search:${originalType}:${query}`, JSON.stringify(existing), "EX", cacheTime);

        return existing;   
    }
});

fastify.get("/seasonal/:type", async (request, reply) => {
    let { type } = request.params as any;

    if (!type || (type.toLowerCase() !== "anime" && type.toLowerCase() !== "manga") && type.toLowerCase() !== "novel") {
        return reply.code(400).send({ error: "Invalid type" });
    }

    const originalType = type;

    if (type.toLowerCase().includes("novel")) {
        type = "manga";
    }

    const cached = await redis.get(`seasonal:${originalType}`);
    if (cached) {
        return JSON.parse(cached);
    }
    
    const formats = type.toLowerCase() === "anime" ? [Format.MOVIE, Format.TV, Format.TV_SHORT, Format.OVA, Format.ONA, Format.OVA] :
                type.toLowerCase() === "manga" ? [Format.MANGA, Format.ONE_SHOT] :
                [Format.NOVEL];

    const aniListData = await loadSeasonal({ type: type.toUpperCase(), formats: formats });
    const data = await seasonal(aniListData?.trending, aniListData?.popular, aniListData?.top, aniListData?.seasonal);

    await redis.set(`seasonal:${originalType}`, JSON.stringify(data), "EX", cacheTime);

    return data;
});

fastify.post("/seasonal", async (request, reply) => {
    let { type } = request.body as any;

    if (!type || (type.toLowerCase() !== "anime" && type.toLowerCase() !== "manga") && type.toLowerCase() !== "novel") {
        return reply.code(400).send({ error: "Invalid type" });
    }

    const originalType = type;

    if (type.toLowerCase().includes("novel")) {
        type = "manga";
    }

    const cached = await redis.get(`seasonal:${originalType}`);
    if (cached) {
        return JSON.parse(cached);
    }
    
    const formats = type.toLowerCase() === "anime" ? [Format.MOVIE, Format.TV, Format.TV_SHORT, Format.OVA, Format.ONA, Format.OVA] :
                type.toLowerCase() === "manga" ? [Format.MANGA, Format.ONE_SHOT] :
                [Format.NOVEL];

    const aniListData = await loadSeasonal({ type: type.toUpperCase(), formats: formats });
    const data = await seasonal(aniListData?.trending, aniListData?.popular, aniListData?.top, aniListData?.seasonal);

    await redis.set(`seasonal:${originalType}`, JSON.stringify(data), "EX", cacheTime);

    return data;
});

fastify.get("/info/:id", async (request, reply) => {
    const { id } = request.params as any;

    if (!id || id.length === 0) {
        return reply.code(400).send({ error: "Invalid ID" });
    }

    const cached = await redis.get(`info:${id}`);
    if (cached) {
        return JSON.parse(cached);
    }

    const existing = await info(id);
    if (existing) {
        await redis.set(`info:${id}`, JSON.stringify(existing), "EX", cacheTime);

        return existing;
    }
    return reply.code(404).send({ error: "Not found" });
});

fastify.post("/info", async (request, reply) => {
    const { id } = request.body as any;

    if (!id || id.length === 0) {
        return reply.code(400).send({ error: "Invalid ID" });
    }

    const cached = await redis.get(`info:${id}`);
    if (cached) {
        return JSON.parse(cached);
    }

    const existing = await info(id);
    if (existing) {
        await redis.set(`info:${id}`, JSON.stringify(existing), "EX", cacheTime);

        return existing;
    }
    return reply.code(404).send({ error: "Not found" });
});

export const start = async () => {
    fastify.listen({ port: port }, function (err, address) {
        if (err) {
            fastify.log.error(err)
            process.exit(1)
        }

        console.log(colors.blue(`Server is now listening on ${address}`));
    })
};