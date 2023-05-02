"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportDatabase = void 0;
const database_1 = require("database");
const fs_1 = require("fs");
const colors_1 = __importDefault(require("colors"));
const exportDatabase = async () => {
    if ((0, fs_1.existsSync)("database.json")) {
        console.log(colors_1.default.yellow("Warning: database.json already exists, overwriting..."));
    }
    console.log(colors_1.default.blue("Exporting database..."));
    try {
        const [animeResult, mangaResult] = await Promise.allSettled([
            database_1.prisma.anime.findMany(),
            database_1.prisma.manga.findMany(),
        ]);
        const anime = animeResult.status === "fulfilled" ? animeResult.value : null;
        const manga = mangaResult.status === "fulfilled" ? mangaResult.value : null;
        if (anime == null || manga == null) {
            const errors = [animeResult, mangaResult]
                .filter((result) => result.status === "rejected")
                .map((result) => result.status);
            throw new Error(`Failed to fetch data: ${errors.join(", ")}`);
        }
        const data = {
            anime,
            manga,
        };
        await fs_1.promises.writeFile("database.json", JSON.stringify(data, null, 2), "utf8");
        console.log(colors_1.default.green("Database exported successfully!"));
    }
    catch (error) {
        console.error(colors_1.default.red("Error exporting database:"), error);
    }
};
exports.exportDatabase = exportDatabase;
(0, exports.exportDatabase)().then(() => process.exit(0));
