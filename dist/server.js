"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.start = void 0;
const fastify_1 = __importDefault(require("fastify"));
const ioredis_1 = __importDefault(require("ioredis"));
const colors_1 = __importDefault(require("colors"));
const worker_1 = __importDefault(require("./worker"));
const database_1 = require("./database");
const season_1 = require("./lib/season");
const port = parseInt(process.env.PORT) || 3000;
const fastify = (0, fastify_1.default)();
const redis = new ioredis_1.default(process.env.REDIS_URL || "redis://localhost:6379");
const cacheTime = process.env.REDIS_CACHE_TIME || 60 * 60 * 24 * 7;
fastify.get("/", async (request, reply) => {
    return { hello: "world" };
});
fastify.get("/search/:type/:query", async (request, reply) => {
    let { type, query } = request.params;
    const validTypes = ["anime", "manga", "novel"];
    if (!validTypes.includes(type.toLowerCase())) {
        return reply.code(400).send({ error: "Invalid type" });
    }
    if (!query || query.length < 3) {
        return reply.code(400).send({ error: "Invalid query" });
    }
    const formats = type.toLowerCase() === "anime" ? ["MOVIE" /* Format.MOVIE */, "TV" /* Format.TV */, "TV_SHORT" /* Format.TV_SHORT */, "OVA" /* Format.OVA */, "ONA" /* Format.ONA */, "OVA" /* Format.OVA */] :
        type.toLowerCase() === "manga" ? ["MANGA" /* Format.MANGA */, "ONE_SHOT" /* Format.ONE_SHOT */] :
            ["NOVEL" /* Format.NOVEL */];
    const originalType = type;
    if (type.toLowerCase().includes("novel")) {
        type = "manga";
    }
    const cached = await redis.get(`search:${originalType}:${query}`);
    if (cached) {
        return JSON.parse(cached);
    }
    const existing = await (0, database_1.search)(query, type.toUpperCase(), formats, 0, 20);
    if (existing.length === 0) {
        worker_1.default.searchQueue.add({ type: type.toUpperCase(), query: query, formats: formats });
        await redis.set(`search:${originalType}:${query}`, JSON.stringify(existing), "EX", cacheTime);
        return [];
    }
    else {
        await redis.set(`search:${originalType}:${query}`, JSON.stringify(existing), "EX", cacheTime);
        return existing;
    }
});
fastify.post("/search", async (request, reply) => {
    let { type, query } = request.body;
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
    const formats = type.toLowerCase() === "anime" ? ["MOVIE" /* Format.MOVIE */, "TV" /* Format.TV */, "TV_SHORT" /* Format.TV_SHORT */, "OVA" /* Format.OVA */, "ONA" /* Format.ONA */, "OVA" /* Format.OVA */] :
        type.toLowerCase() === "manga" ? ["MANGA" /* Format.MANGA */, "ONE_SHOT" /* Format.ONE_SHOT */] :
            ["NOVEL" /* Format.NOVEL */];
    const existing = await (0, database_1.search)(query, type.toUpperCase(), formats, 0, 20);
    if (existing.length === 0) {
        worker_1.default.searchQueue.add({ type: type.toUpperCase(), query: query, formats: formats });
        await redis.set(`search:${originalType}:${query}`, JSON.stringify(existing), "EX", cacheTime);
        return [];
    }
    else {
        await redis.set(`search:${originalType}:${query}`, JSON.stringify(existing), "EX", cacheTime);
        return existing;
    }
});
fastify.get("/seasonal/:type", async (request, reply) => {
    let { type } = request.params;
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
    const formats = type.toLowerCase() === "anime" ? ["MOVIE" /* Format.MOVIE */, "TV" /* Format.TV */, "TV_SHORT" /* Format.TV_SHORT */, "OVA" /* Format.OVA */, "ONA" /* Format.ONA */, "OVA" /* Format.OVA */] :
        type.toLowerCase() === "manga" ? ["MANGA" /* Format.MANGA */, "ONE_SHOT" /* Format.ONE_SHOT */] :
            ["NOVEL" /* Format.NOVEL */];
    const aniListData = await (0, season_1.loadSeasonal)({ type: type.toUpperCase(), formats: formats });
    const data = await (0, database_1.seasonal)(aniListData?.trending, aniListData?.popular, aniListData?.top, aniListData?.seasonal);
    await redis.set(`seasonal:${originalType}`, JSON.stringify(data), "EX", cacheTime);
    return data;
});
fastify.post("/seasonal", async (request, reply) => {
    let { type } = request.body;
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
    const formats = type.toLowerCase() === "anime" ? ["MOVIE" /* Format.MOVIE */, "TV" /* Format.TV */, "TV_SHORT" /* Format.TV_SHORT */, "OVA" /* Format.OVA */, "ONA" /* Format.ONA */, "OVA" /* Format.OVA */] :
        type.toLowerCase() === "manga" ? ["MANGA" /* Format.MANGA */, "ONE_SHOT" /* Format.ONE_SHOT */] :
            ["NOVEL" /* Format.NOVEL */];
    const aniListData = await (0, season_1.loadSeasonal)({ type: type.toUpperCase(), formats: formats });
    const data = await (0, database_1.seasonal)(aniListData?.trending, aniListData?.popular, aniListData?.top, aniListData?.seasonal);
    await redis.set(`seasonal:${originalType}`, JSON.stringify(data), "EX", cacheTime);
    return data;
});
fastify.get("/info/:id", async (request, reply) => {
    const { id } = request.params;
    if (!id || id.length === 0) {
        return reply.code(400).send({ error: "Invalid ID" });
    }
    const cached = await redis.get(`info:${id}`);
    if (cached) {
        return JSON.parse(cached);
    }
    const existing = await (0, database_1.info)(id);
    if (existing) {
        await redis.set(`info:${id}`, JSON.stringify(existing), "EX", cacheTime);
        return existing;
    }
    return reply.code(404).send({ error: "Not found" });
});
fastify.post("/info", async (request, reply) => {
    const { id } = request.body;
    if (!id || id.length === 0) {
        return reply.code(400).send({ error: "Invalid ID" });
    }
    const cached = await redis.get(`info:${id}`);
    if (cached) {
        return JSON.parse(cached);
    }
    const existing = await (0, database_1.info)(id);
    if (existing) {
        await redis.set(`info:${id}`, JSON.stringify(existing), "EX", cacheTime);
        return existing;
    }
    return reply.code(404).send({ error: "Not found" });
});
const start = async () => {
    fastify.listen({ port: port }, function (err, address) {
        if (err) {
            fastify.log.error(err);
            process.exit(1);
        }
        console.log(colors_1.default.blue(`Server is now listening on ${address}`));
    });
};
exports.start = start;
