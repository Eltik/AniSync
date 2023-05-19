"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importDatabase = void 0;
const database_1 = require("../database");
const fs_1 = require("fs");
const colors_1 = __importDefault(require("colors"));
/**
 * Imports the database from a JSON file.
 * @returns {Promise<void>}
 */
const importDatabase = async () => {
    if (!(0, fs_1.existsSync)("database.json")) {
        console.error(colors_1.default.red("Error importing database: database.json does not exist"));
        throw new Error("Database import failed");
    }
    console.log(colors_1.default.blue("Importing database..."));
    try {
        const data = JSON.parse(await fs_1.promises.readFile("database.json", "utf8"));
        const { anime, manga } = data;
        const [importedAnime, importedManga] = await Promise.all([
            database_1.prisma.anime.createMany({
                data: anime,
                skipDuplicates: true,
            }),
            database_1.prisma.manga.createMany({
                data: manga,
                skipDuplicates: true,
            }),
        ]);
        console.log(colors_1.default.green(`Database imported successfully! Imported ${importedAnime.count} anime and ${importedManga.count} manga.`));
        return;
    }
    catch (error) {
        console.error(colors_1.default.red(`Error importing database: ${error}`));
        throw new Error("Database import failed");
    }
};
exports.importDatabase = importDatabase;
(0, exports.importDatabase)().then(() => process.exit(0));
