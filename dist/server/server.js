"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.start = void 0;
const express_1 = __importDefault(require("express"));
const node_cluster_1 = __importDefault(require("node:cluster"));
const node_os_1 = __importDefault(require("node:os"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_domain_middleware_1 = __importDefault(require("express-domain-middleware"));
const ioredis_1 = __importDefault(require("ioredis"));
const colors_1 = __importDefault(require("colors"));
const worker_1 = __importDefault(require("../worker"));
const database_1 = require("../database");
const season_1 = require("../lib/season");
const __1 = require("..");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const port = parseInt(process.env.PORT) || 3000;
const app = (0, express_1.default)();
const numCPUs = node_os_1.default.cpus().length;
const corsOptions = {
    origin: "*",
    methods: ["POST", "GET", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
};
app.use((0, cors_1.default)(corsOptions));
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use(body_parser_1.default.json());
app.use(express_domain_middleware_1.default);
app.use((0, cookie_parser_1.default)());
const redis = new ioredis_1.default(process.env.REDIS_URL || "redis://localhost:6379");
const cacheTime = process.env.REDIS_CACHE_TIME || 60 * 60 * 24 * 7;
app.get("/", async (request, reply) => {
    const cached = await redis.get(`index`);
    if (cached) {
        return reply.send(cached);
    }
    const data = (0, node_fs_1.readFileSync)((0, node_path_1.join)(__dirname, "./documentation.html")).toString();
    await redis.set(`index`, data, "EX", cacheTime);
    return reply.send(data);
});
app.get("/stats", async (request, reply) => {
    const data = {
        anime: 0,
        manga: 0,
        novels: 0,
        unresolvedEvents: __1.unresolvedEvents.length,
    };
    const manga = await database_1.prisma.manga.count();
    const mangaNotNovels = await database_1.prisma.manga.count({
        where: {
            format: {
                not: "NOVEL",
            },
        },
    });
    data.anime = await database_1.prisma.anime.count();
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
    const manga = await database_1.prisma.manga.count();
    const mangaNotNovels = await database_1.prisma.manga.count({
        where: {
            format: {
                not: "NOVEL",
            },
        },
    });
    data.anime = await database_1.prisma.anime.count();
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
    const { query } = request.params;
    let { type } = request.params;
    const validTypes = ["anime", "manga", "novel"];
    if (!validTypes.includes(type.toLowerCase())) {
        return reply.status(400).send({ error: "Invalid type" });
    }
    if (!query || query.length < 3) {
        return reply.status(400).send({ error: "Invalid query" });
    }
    const formats = type.toLowerCase() === "anime" ? ["MOVIE" /* Format.MOVIE */, "TV" /* Format.TV */, "TV_SHORT" /* Format.TV_SHORT */, "OVA" /* Format.OVA */, "ONA" /* Format.ONA */, "OVA" /* Format.OVA */] : type.toLowerCase() === "manga" ? ["MANGA" /* Format.MANGA */, "ONE_SHOT" /* Format.ONE_SHOT */] : ["NOVEL" /* Format.NOVEL */];
    const originalType = type;
    if (type.toLowerCase().includes("novel")) {
        type = "manga";
    }
    const cached = await redis.get(`search:${originalType}:${query}`);
    if (cached) {
        return reply.json(JSON.parse(cached));
    }
    const existing = await (0, database_1.search)(query, type.toUpperCase(), formats, 0, 20);
    if (existing.length === 0) {
        worker_1.default.searchQueue.add({ type: type.toUpperCase(), query: query, formats: formats });
        await redis.set(`search:${originalType}:${query}`, JSON.stringify([]), "EX", cacheTime);
        return reply.json([]);
    }
    else {
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
    const { query } = request.body;
    let { type } = request.body;
    if (!type || (type.toLowerCase() !== "anime" && type.toLowerCase() !== "manga" && type.toLowerCase() !== "novel")) {
        return reply.status(400).send({ error: "Invalid type" });
    }
    if (!query || query.length < 3) {
        return reply.status(400).send({ error: "Invalid query" });
    }
    const formats = type.toLowerCase() === "anime" ? ["MOVIE" /* Format.MOVIE */, "TV" /* Format.TV */, "TV_SHORT" /* Format.TV_SHORT */, "OVA" /* Format.OVA */, "ONA" /* Format.ONA */, "OVA" /* Format.OVA */] : type.toLowerCase() === "manga" ? ["MANGA" /* Format.MANGA */, "ONE_SHOT" /* Format.ONE_SHOT */] : ["NOVEL" /* Format.NOVEL */];
    const originalType = type;
    if (type.toLowerCase().includes("novel")) {
        type = "manga";
    }
    const cached = await redis.get(`search:${originalType}:${query}`);
    if (cached) {
        return reply.json(JSON.parse(cached));
    }
    const existing = await (0, database_1.search)(query, type.toUpperCase(), formats, 0, 20);
    if (existing.length === 0) {
        worker_1.default.searchQueue.add({ type: type.toUpperCase(), query: query, formats: formats });
        await redis.set(`search:${originalType}:${query}`, JSON.stringify([]), "EX", cacheTime);
        return reply.json([]);
    }
    else {
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
    let { type } = request.params;
    if (!type || (type.toLowerCase() !== "anime" && type.toLowerCase() !== "manga" && type.toLowerCase() !== "novel")) {
        return reply.status(400).send({ error: "Invalid type" });
    }
    const formats = type.toLowerCase() === "anime" ? ["MOVIE" /* Format.MOVIE */, "TV" /* Format.TV */, "TV_SHORT" /* Format.TV_SHORT */, "OVA" /* Format.OVA */, "ONA" /* Format.ONA */, "OVA" /* Format.OVA */] : type.toLowerCase() === "manga" ? ["MANGA" /* Format.MANGA */, "ONE_SHOT" /* Format.ONE_SHOT */] : ["NOVEL" /* Format.NOVEL */];
    const originalType = type;
    if (type.toLowerCase().includes("novel")) {
        type = "manga";
    }
    const cached = await redis.get(`seasonal:${originalType}`);
    if (cached) {
        return reply.json(JSON.parse(cached));
    }
    const aniListData = await (0, season_1.loadSeasonal)({ type: type.toUpperCase(), formats: formats });
    const data = await (0, database_1.seasonal)(aniListData?.trending, aniListData?.popular, aniListData?.top, aniListData?.seasonal);
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
    let { type } = request.body;
    if (!type || (type.toLowerCase() !== "anime" && type.toLowerCase() !== "manga" && type.toLowerCase() !== "novel")) {
        return reply.status(400).send({ error: "Invalid type" });
    }
    const formats = type.toLowerCase() === "anime" ? ["MOVIE" /* Format.MOVIE */, "TV" /* Format.TV */, "TV_SHORT" /* Format.TV_SHORT */, "OVA" /* Format.OVA */, "ONA" /* Format.ONA */, "OVA" /* Format.OVA */] : type.toLowerCase() === "manga" ? ["MANGA" /* Format.MANGA */, "ONE_SHOT" /* Format.ONE_SHOT */] : ["NOVEL" /* Format.NOVEL */];
    const originalType = type;
    if (type.toLowerCase().includes("novel")) {
        type = "manga";
    }
    const cached = await redis.get(`seasonal:${originalType}`);
    if (cached) {
        return reply.json(JSON.parse(cached));
    }
    const aniListData = await (0, season_1.loadSeasonal)({ type: type.toUpperCase(), formats: formats });
    const data = await (0, database_1.seasonal)(aniListData?.trending, aniListData?.popular, aniListData?.top, aniListData?.seasonal);
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
    const { id } = request.params;
    if (!id || id.length === 0) {
        return reply.status(400).send({ error: "Invalid ID" });
    }
    const cached = await redis.get(`info:${id}`);
    if (cached) {
        return reply.json(JSON.parse(cached));
    }
    const existing = await (0, database_1.info)(id);
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
    const { id } = request.body;
    if (!id || id.length === 0) {
        return reply.status(400).send({ error: "Invalid ID" });
    }
    const cached = await redis.get(`info:${id}`);
    if (cached) {
        return reply.json(JSON.parse(cached));
    }
    const existing = await (0, database_1.info)(id);
    if (existing) {
        await redis.set(`info:${id}`, JSON.stringify(existing), "EX", cacheTime);
        return reply.json(existing);
    }
    return reply.status(404).send({ error: "Not found" });
});
const start = async () => {
    const masterProcess = () => Array.from(Array(numCPUs)).map(node_cluster_1.default.fork);
    const childProcess = () => app.listen({ port: port }, function (err, address) {
        if (err) {
            process.exit(1);
        }
        console.log(colors_1.default.blue(`Server is now listening on ${port}`));
    });
    if (node_cluster_1.default.isPrimary)
        masterProcess();
    else
        childProcess();
    node_cluster_1.default.on("exit", (worker) => node_cluster_1.default.fork());
};
exports.start = start;
