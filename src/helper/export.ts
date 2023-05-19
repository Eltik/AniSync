import { prisma } from "database";
import { existsSync, promises as fs } from "fs";
import colors from "colors";

export const exportDatabase = async () => {
    if (existsSync("database.json")) {
        console.log(colors.yellow("Warning: database.json already exists, overwriting..."));
    }

    console.log(colors.blue("Exporting database..."));

    try {
        const [animeResult, mangaResult] = await Promise.allSettled([prisma.anime.findMany(), prisma.manga.findMany()]);

        const anime = animeResult.status === "fulfilled" ? animeResult.value : null;
        const manga = mangaResult.status === "fulfilled" ? mangaResult.value : null;

        if (anime == null || manga == null) {
            const errors = [animeResult, mangaResult].filter((result) => result.status === "rejected").map((result) => result.status);

            throw new Error(`Failed to fetch data: ${errors.join(", ")}`);
        }

        const data = {
            anime,
            manga,
        };

        await fs.writeFile("database.json", JSON.stringify(data, null, 2), "utf8");

        console.log(colors.green("Database exported successfully!"));
    } catch (error) {
        console.error(colors.red("Error exporting database:"), error);
    }
};

exportDatabase().then(() => process.exit(0));
