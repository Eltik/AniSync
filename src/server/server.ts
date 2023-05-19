import express from "express";
import cluster from "node:cluster";
import os from "node:os";

import bodyParser from "body-parser";
import cors from "cors";
import cookieParser from "cookie-parser";
import expressDomainMiddleware from "express-domain-middleware";

import Redis from "ioredis";

import colors from "colors";

import queues from "../worker";
import { Anime, Format } from "../mapping";
import { info, prisma, search, seasonal } from "../database";
import { loadSeasonal } from "../lib/season";
import { unresolvedEvents } from "..";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const port = parseInt(process.env.PORT as string) || 3000;

const app = express();
const numCPUs = os.cpus().length;

const corsOptions = {
    origin: "*",
    methods: ["POST", "GET", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(expressDomainMiddleware);
app.use(cookieParser());

const redis = new Redis((process.env.REDIS_URL as string) || "redis://localhost:6379");
const cacheTime = (process.env.REDIS_CACHE_TIME as string) || 60 * 60 * 24 * 7;

app.get("/", async (request, reply) => {
    const cached = await redis.get(`index`);
    if (cached) {
        return reply.send(cached);
    }

    const data = readFileSync(join(__dirname, "./documentation.html")).toString();

    await redis.set(`index`, data, "EX", cacheTime);

    return reply.send(data);
});

app.get("/stats", async (request, reply) => {
    const data = {
        anime: 0,
        manga: 0,
        novels: 0,
        unresolvedEvents: unresolvedEvents.length,
    };

    const manga = await prisma.manga.count();
    const mangaNotNovels = await prisma.manga.count({
        where: {
            format: {
                not: "NOVEL",
            },
        },
    });

    data.anime = await prisma.anime.count();
    data.manga = mangaNotNovels;
    data.novels = manga - mangaNotNovels;

    return reply.json(data);
});

app.post("/stats", async (request, reply) => {
    const cached = await redis.get(`stats`);
    if (cached) {
        return reply.json(JSON.parse(cached));
    }

    const data = {
        anime: 0,
        manga: 0,
        novels: 0,
    };

    const manga = await prisma.manga.count();
    const mangaNotNovels = await prisma.manga.count({
        where: {
            format: {
                not: "NOVEL",
            },
        },
    });

    data.anime = await prisma.anime.count();
    data.manga = mangaNotNovels;
    data.novels = manga - mangaNotNovels;

    await redis.set(`stats`, JSON.stringify(data), "EX", cacheTime);

    return reply.json(data);
});

/**
 * Searches for items of the given type based on the provided query.
 *
 * @param {String} type - The type of items to search for (anime, manga, novel).
 * @param {String} query - The search query.
 *
 * @throws {400} Invalid type - If the provided type is not valid.
 * @throws {400} Invalid query - If the provided query is invalid.
 */
app.get("/search/:type/:query", async (request, reply) => {
    const { query } = request.params as any;
    let { type } = request.params as any;

    const validTypes = ["anime", "manga", "novel"];
    if (!validTypes.includes(type.toLowerCase())) {
        return reply.status(400).send({ error: "Invalid type" });
    }

    if (!query || query.length < 3) {
        return reply.status(400).send({ error: "Invalid query" });
    }

    const formats = type.toLowerCase() === "anime" ? [Format.MOVIE, Format.TV, Format.TV_SHORT, Format.OVA, Format.ONA, Format.OVA] : type.toLowerCase() === "manga" ? [Format.MANGA, Format.ONE_SHOT] : [Format.NOVEL];

    const originalType = type;

    if (type.toLowerCase().includes("novel")) {
        type = "manga";
    }

    const cached = await redis.get(`search:${originalType}:${query}`);
    if (cached) {
        return reply.json(JSON.parse(cached));
    }

    const existing = await search(query, type.toUpperCase(), formats, 0, 20);
    if (existing.length === 0) {
        queues.searchQueue.add({ type: type.toUpperCase(), query: query, formats: formats });

        await redis.set(`search:${originalType}:${query}`, JSON.stringify([]), "EX", cacheTime);

        return reply.json([]);
    } else {
        await redis.set(`search:${originalType}:${query}`, JSON.stringify(existing), "EX", cacheTime);

        return reply.json(existing);
    }
});

/**
 * Searches for items of the given type based on the provided query.
 *
 * @param {String} type - The type of items to search for (anime, manga, novel).
 * @param {String} query - The search query.
 *
 * @throws {400} Invalid type - If the provided type is not valid.
 * @throws {400} Invalid query - If the provided query is invalid.
 */
app.post("/search", async (request, reply) => {
    const { query } = request.body as any;
    let { type } = request.body as any;

    if (!type || (type.toLowerCase() !== "anime" && type.toLowerCase() !== "manga" && type.toLowerCase() !== "novel")) {
        return reply.status(400).send({ error: "Invalid type" });
    }

    if (!query || query.length < 3) {
        return reply.status(400).send({ error: "Invalid query" });
    }

    const formats = type.toLowerCase() === "anime" ? [Format.MOVIE, Format.TV, Format.TV_SHORT, Format.OVA, Format.ONA, Format.OVA] : type.toLowerCase() === "manga" ? [Format.MANGA, Format.ONE_SHOT] : [Format.NOVEL];

    const originalType = type;

    if (type.toLowerCase().includes("novel")) {
        type = "manga";
    }

    const cached = await redis.get(`search:${originalType}:${query}`);
    if (cached) {
        return reply.json(JSON.parse(cached));
    }

    const existing = await search(query, type.toUpperCase(), formats, 0, 20);
    if (existing.length === 0) {
        queues.searchQueue.add({ type: type.toUpperCase(), query: query, formats: formats });

        await redis.set(`search:${originalType}:${query}`, JSON.stringify([]), "EX", cacheTime);

        return reply.json([]);
    } else {
        await redis.set(`search:${originalType}:${query}`, JSON.stringify(existing), "EX", cacheTime);

        return reply.json(existing);
    }
});

/**
 * Retrieves seasonal items of the given type.
 *
 * @param {String} type - The type of items to retrieve (anime, manga, novel).
 *
 * @throws {400} Invalid type - If the provided type is not valid.
 */
app.get("/seasonal/:type", async (request, reply) => {
    let { type } = request.params as any;

    if (!type || (type.toLowerCase() !== "anime" && type.toLowerCase() !== "manga" && type.toLowerCase() !== "novel")) {
        return reply.status(400).send({ error: "Invalid type" });
    }

    const formats = type.toLowerCase() === "anime" ? [Format.MOVIE, Format.TV, Format.TV_SHORT, Format.OVA, Format.ONA, Format.OVA] : type.toLowerCase() === "manga" ? [Format.MANGA, Format.ONE_SHOT] : [Format.NOVEL];

    const originalType = type;

    if (type.toLowerCase().includes("novel")) {
        type = "manga";
    }

    const cached = await redis.get(`seasonal:${originalType}`);
    if (cached) {
        return reply.json(JSON.parse(cached));
    }

    const aniListData = await loadSeasonal({ type: type.toUpperCase(), formats: formats });
    const data = await seasonal(aniListData?.trending, aniListData?.popular, aniListData?.top, aniListData?.seasonal);

    await redis.set(`seasonal:${originalType}`, JSON.stringify(data), "EX", cacheTime);

    return reply.json(data);
});

/**
 * Retrieves seasonal items of the given type.
 *
 * @param {String} type - The type of items to retrieve (anime, manga, novel).
 *
 * @throws {400} Invalid type - If the provided type is not valid.
 */
app.post("/seasonal", async (request, reply) => {
    let { type } = request.body as any;

    if (!type || (type.toLowerCase() !== "anime" && type.toLowerCase() !== "manga" && type.toLowerCase() !== "novel")) {
        return reply.status(400).send({ error: "Invalid type" });
    }

    const formats = type.toLowerCase() === "anime" ? [Format.MOVIE, Format.TV, Format.TV_SHORT, Format.OVA, Format.ONA, Format.OVA] : type.toLowerCase() === "manga" ? [Format.MANGA, Format.ONE_SHOT] : [Format.NOVEL];

    const originalType = type;

    if (type.toLowerCase().includes("novel")) {
        type = "manga";
    }

    const cached = await redis.get(`seasonal:${originalType}`);
    if (cached) {
        return reply.json(JSON.parse(cached));
    }

    const aniListData = await loadSeasonal({ type: type.toUpperCase(), formats: formats });
    const data = await seasonal(aniListData?.trending, aniListData?.popular, aniListData?.top, aniListData?.seasonal);

    await redis.set(`seasonal:${originalType}`, JSON.stringify(data), "EX", cacheTime);

    return reply.json(data);
});

/**
 * Retrieves information for a media.
 *
 * @param {String} id - The ID to get information about.
 *
 * @throws {400} Invalid ID - If there is no provided ID.
 * @throws {404} Not found - If the provided ID is not found in the database.
 */
app.get("/info/:id", async (request, reply) => {
    const { id } = request.params as any;

    if (!id || id.length === 0) {
        return reply.status(400).send({ error: "Invalid ID" });
    }

    const cached = await redis.get(`info:${id}`);
    if (cached) {
        return reply.json(JSON.parse(cached));
    }

    const existing = await info(id);
    if (existing) {
        await redis.set(`info:${id}`, JSON.stringify(existing), "EX", cacheTime);

        return reply.json(existing);
    }
    return reply.status(404).send({ error: "Not found" });
});

/**
 * Retrieves information for a media.
 *
 * @param {String} id - The ID to get information about.
 *
 * @throws {400} Invalid ID - If there is no provided ID.
 * @throws {404} Not found - If the provided ID is not found in the database.
 */
app.post("/info", async (request, reply) => {
    const { id } = request.body as any;

    if (!id || id.length === 0) {
        return reply.status(400).send({ error: "Invalid ID" });
    }

    const cached = await redis.get(`info:${id}`);
    if (cached) {
        return reply.json(JSON.parse(cached));
    }

    const existing = await info(id);
    if (existing) {
        await redis.set(`info:${id}`, JSON.stringify(existing), "EX", cacheTime);

        return reply.json(existing);
    }
    return reply.status(404).send({ error: "Not found" });
});

export const start = async () => {
    const masterProcess = () => Array.from(Array(numCPUs)).map(cluster.fork);
    const childProcess = () =>
        app.listen({ port: port }, function (err, address) {
            if (err) {
                process.exit(1);
            }

            console.log(colors.blue(`Server is now listening on ${port}`));
        });

    if (cluster.isPrimary) masterProcess();
    else childProcess();
    cluster.on("exit", (worker) => cluster.fork());
};
