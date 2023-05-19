import { prisma } from "database";
import { existsSync, promises as fs } from "fs";
import colors from "colors";

/**
 * Imports the database from a JSON file.
 * @returns {Promise<void>}
 */
export const importDatabase = async (): Promise<void> => {
    if (!existsSync("database.json")) {
        console.error(colors.red("Error importing database: database.json does not exist"));
        throw new Error("Database import failed");
    }

    console.log(colors.blue("Importing database..."));

    try {
        const data = JSON.parse(await fs.readFile("database.json", "utf8"));

        const { anime, manga } = data;

        const [importedAnime, importedManga] = await Promise.all([
            prisma.anime.createMany({
                data: anime,
                skipDuplicates: true,
            }),
            prisma.manga.createMany({
                data: manga,
                skipDuplicates: true,
            }),
        ]);

        console.log(colors.green(`Database imported successfully! Imported ${importedAnime.count} anime and ${importedManga.count} manga.`));

        return;
    } catch (error) {
        console.error(colors.red(`Error importing database: ${error}`));
        throw new Error("Database import failed");
    }
};

importDatabase().then(() => process.exit(0));
