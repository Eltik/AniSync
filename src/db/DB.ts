import { FormattedResponse } from "../Core";
import { Format, Type } from "../meta/AniList";
import { prisma } from './client';
import colors from "colors";
import API, { ProviderType } from "../types/API";
import { join } from "path";
import { Database } from "sqlite3";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { Prisma } from "@prisma/client";

export default class DB extends API {
    private isSQlite:boolean;
    private db = null;
    
    constructor(isSQlite:boolean = false) {
        super(ProviderType.NONE);
        this.isSQlite = isSQlite;
        if (this.isSQlite) {
            this.db = new Database(join(__dirname, "../../db.db"));
        }
    }

    public async init() {
        if (this.isSQlite) {
            await this.createDatabase();
            return;
        }
        await prisma.$executeRaw`
            CREATE EXTENSION IF NOT EXISTS "pg_trgm";
        `;
        if (this.config.debug) console.log(colors.gray("Created ") + colors.blue("pg_trgm") + colors.gray(" extension."));
        await prisma.$executeRaw`
            create or replace function most_similar(text, text[]) returns double precision
            language sql as $$
                select max(similarity($1,x)) from unnest($2) f(x)
            $$;
        `;
        if (this.config.debug) console.log(colors.gray("Created ") + colors.blue("most_similar") + colors.gray(" function."));
        await prisma.$connect();
        return;
    }

    public async clearDatabase() {
        if (this.isSQlite) {
            await this.db.run("DELETE FROM anime");
            if (this.config.debug) console.log(colors.gray("Deleted ") + colors.blue("anime") + colors.gray(" table."));
            await this.db.run("DELETE FROM manga");
            if (this.config.debug) console.log(colors.gray("Deleted ") + colors.blue("manga") + colors.gray(" table."));
            await this.db.run("DELETE FROM pdf");
            if (this.config.debug) console.log(colors.gray("Deleted ") + colors.blue("pdf") + colors.gray(" table."));
            return;
        }
        await prisma.anime.deleteMany();
        if (this.config.debug) console.log(colors.gray("Deleted ") + colors.blue("anime") + colors.gray(" table."));
        await prisma.manga.deleteMany();
        if (this.config.debug) console.log(colors.gray("Deleted ") + colors.blue("manga") + colors.gray(" table."));
        return;
    }

    private async createDatabase(): Promise<void> {
        if (!this.isSQlite) {
            console.log(colors.yellow("You are not using SQLite! Run ") + colors.blue("npm run build:db") + colors.yellow(" to create the database!"));
            return;
        }
        const db = this.db;
        const config = this.config;

        const promises = [];
        const anime = new Promise((resolve, reject) => {
            db.run("CREATE TABLE IF NOT EXISTS anime (id INTEGER PRIMARY KEY, idMal INTEGER not null, title longtext not null, coverImage longtext not null, bannerImage varchar(100), startDate longtext, description longtext, season varchar(100), seasonYear integer, type varchar(100) not null, format varchar(100), status varchar(100), genres longtext, synonyms longtext, source varchar(100), meanScore integer, averageScore integer, relations longtext, streamingEpisodes longtext, trailer longtext, connectors longtext not null)", function (err) {
                if (err) reject(err);

                if (config.debug) {
                    console.log(colors.gray("Created ") + colors.blue("anime") + colors.gray(" table."));
                }
                resolve(true);
            });
        })
        const manga = new Promise((resolve, reject) => {
            db.run("CREATE TABLE IF NOT EXISTS manga (id INTEGER PRIMARY KEY, idMal INTEGER not null, title longtext not null, coverImage longtext not null, bannerImage varchar(100), startDate longtext, description longtext, season varchar(100), seasonYear integer, type varchar(100) not null, format varchar(100), status varchar(100), genres longtext, synonyms longtext, source varchar(100), meanScore integer, averageScore integer, relations longtext, streamingEpisodes longtext, trailer longtext, connectors longtext not null)", function (err) {
                if (err) reject(err);

                if (config.debug) {
                    console.log(colors.gray("Created ") + colors.blue("manga") + colors.gray(" table."));
                }
                resolve(true);
            });
        }) 
        promises.push(anime);
        promises.push(manga);
        await Promise.all(promises);
    }

    public async search(query:string, type:Type, format?:Format[], page?:number, perPage?:number): Promise<FormattedResponse[]> {
        if (!page || page <= 0) page = 1;
        if (!perPage || perPage <= 0) perPage = 20;
        perPage = Math.min(100, perPage);
    
        const skip = page > 0 ? perPage * (page - 1) : 0;

        if (this.isSQlite) {
            let where = `
            WHERE
            (
                '%${query}%' IN (synonyms)
                OR title->>'english' LIKE '%${query}%'
                OR title->>'romaji' LIKE '%${query}%'
                OR title->>'native' LIKE '%${query}%'
                OR synonyms LIKE '%${query}%'
            )
            ${format && format.length > 0 ? `AND "format" IN (${format.map(f => `'${f}'`).join(', ')})` : ''}
            `;

            const c = new Promise((resolve, reject) => {
                this.db.all(`SELECT COUNT(*) as count FROM ${type} ${where}`, (err, rows) => {
                    if (err) reject(err);
                    resolve(rows);
                });
            })
            const r = new Promise((resolve, reject) => {
                this.db.all(`SELECT * FROM ${type} ${where} ORDER BY title->>'english' LIMIT ${perPage} OFFSET ${skip}`, (err, rows) => {
                    if (err) reject(err);
                    resolve(rows);
                });
            });
            const [results, count]: any[] = await Promise.all([r, c]);
            const total: number = Number((count as any[])[0].count);
            const lastPage = Math.ceil(Number(total) / perPage);

            for (let i = 0; i < results.length; i++) {
                const row = results[i];
                row.title = JSON.parse(row.title);
                row.coverImage = JSON.parse(row.coverImage);
                row.startDate = JSON.parse(row.startDate);
                row.genres = JSON.parse(row.genres);
                row.synonyms = JSON.parse(row.synonyms);
                row.relations = JSON.parse(row.relations);
                row.streamingEpisodes = JSON.parse(row.streamingEpisodes);
                row.trailer = JSON.parse(row.trailer);
                row.connectors = JSON.parse(row.connectors);
                results[i] = row;
            }
            return results as FormattedResponse[];
        } else {
            let where: Prisma.Sql;
            if (type === Type.ANIME) {
                where = Prisma.sql`
                    WHERE
                    (
                        ${"%" + query + "%"}        ILIKE ANY("Anime".synonyms)
                        OR  ${"%" + query + "%"}    % ANY("Anime".synonyms)
                        OR  "Anime".title->>'english' ILIKE ${"%" + query + "%"}
                        OR  "Anime".title->>'romaji'  ILIKE ${"%" + query + "%"}
                        OR  "Anime".title->>'native'  ILIKE ${"%" + query + "%"}
                    )
                    ${format && format.length > 0 ? Prisma.sql`AND "Anime"."format" IN (${Prisma.join(
                        format.map(f => Prisma.raw(`'${f}'`)),
                        ", "
                    )})` : Prisma.empty}
                `;
            } else {
                where = Prisma.sql`
                    WHERE
                    (
                        ${"%" + query + "%"}        ILIKE ANY("Manga".synonyms)
                        OR  ${"%" + query + "%"}    % ANY("Manga".synonyms)
                        OR  "Manga".title->>'english' ILIKE ${"%" + query + "%"}
                        OR  "Manga".title->>'romaji'  ILIKE ${"%" + query + "%"}
                        OR  "Manga".title->>'native'  ILIKE ${"%" + query + "%"}
                    )
                    ${format && format.length > 0 ? Prisma.sql`AND "Manga"."format" IN (${Prisma.join(
                        format.map(f => Prisma.raw(`'${f}'`)),
                        ", "
                    )})` : Prisma.empty}
                `;
            }

            let [count, results] = [0, []];
            if (type === Type.ANIME) {
                [count, results] = await prisma.$transaction([
                    prisma.$queryRaw`
                            SELECT COUNT(*) FROM "Anime"
                            ${where}
                        `,
                    prisma.$queryRaw`
                            SELECT * FROM "Anime"
                            ${where}
                            ORDER BY
                                (CASE WHEN "Anime".title->>'english' IS NOT NULL THEN similarity(LOWER("Anime".title->>'english'), LOWER(${query})) ELSE 0 END,
                                + CASE WHEN "Anime".title->>'romaji' IS NOT NULL THEN similarity(LOWER("Anime".title->>'romaji'), LOWER(${query})) ELSE 0 END,
                                + CASE WHEN "Anime".title->>'native' IS NOT NULL THEN similarity(LOWER("Anime".title->>'native'), LOWER(${query})) ELSE 0 END,
                                + CASE WHEN synonyms IS NOT NULL THEN most_similar(LOWER(${query}), synonyms) ELSE 0 END)
                                    DESC
                            LIMIT    ${perPage}
                            OFFSET   ${skip}
                        `,
                ]);
            } else {
                [count, results] = await prisma.$transaction([
                    prisma.$queryRaw`
                            SELECT COUNT(*) FROM "Manga"
                            ${where}
                        `,
                    prisma.$queryRaw`
                            SELECT * FROM "Manga"
                            ${where}
                             ORDER BY
                                (CASE WHEN "Manga".title->>'english' IS NOT NULL THEN similarity(LOWER("Manga".title->>'english'), LOWER(${query})) ELSE 0 END,
                                + CASE WHEN "Manga".title->>'romaji' IS NOT NULL THEN similarity(LOWER("Manga".title->>'romaji'), LOWER(${query})) ELSE 0 END,
                                + CASE WHEN "Manga".title->>'native' IS NOT NULL THEN similarity(LOWER("Manga".title->>'native'), LOWER(${query})) ELSE 0 END,
                                + CASE WHEN synonyms IS NOT NULL THEN most_similar(LOWER(${query}), synonyms) ELSE 0 END)
                                    DESC
                            LIMIT    ${perPage}
                            OFFSET   ${skip}
                        `,
                ]);
            }

            const total: number = Number((count)[0].count);
            const lastPage = Math.ceil(Number(total) / perPage);
        
            return results as FormattedResponse[];
        }
    }

    public async get(id:string, type:Type, format?:Format[]): Promise<FormattedResponse> {
        if (this.isSQlite) {
            let where = `
            WHERE
            (
                id = ${id}
            )
            ${format && format.length > 0 ? `AND "format" IN (${format.map(f => `'${f}'`).join(', ')})` : ''}
            `;

            const c = new Promise((resolve, reject) => {
                this.db.all(`SELECT COUNT(*) as count FROM ${type} ${where}`, (err, rows) => {
                    if (err) reject(err);
                    resolve(rows);
                });
            })
            const r = new Promise((resolve, reject) => {
                this.db.all(`SELECT * FROM ${type} ${where}`, (err, rows) => {
                    if (err) reject(err);
                    resolve(rows);
                });
            });
            const [results, count]: any[] = await Promise.all([r, c]);

            for (let i = 0; i < results.length; i++) {
                const row = results[i];
                row.title = JSON.parse(row.title);
                row.coverImage = JSON.parse(row.coverImage);
                row.startDate = JSON.parse(row.startDate);
                row.genres = JSON.parse(row.genres);
                row.synonyms = JSON.parse(row.synonyms);
                row.relations = JSON.parse(row.relations);
                row.streamingEpisodes = JSON.parse(row.streamingEpisodes);
                row.trailer = JSON.parse(row.trailer);
                row.connectors = JSON.parse(row.connectors);
                results[i] = row;
            }
            return results[0] as FormattedResponse;
        } else {
            const filter: any = { id: Number(id) };
            if (format) {
                filter.AND = format.map((format) => {
                    return { format: { contains: format } };
                });
            }

            let where: Prisma.Sql;
            if (type === Type.ANIME) {
                where = Prisma.sql`
                    WHERE
                    (
                        "Anime"."id" = ${Number(id)}
                    )
                    ${format && format.length > 0 ? Prisma.sql`AND "Anime"."format" IN (${Prisma.join(
                        format.map(f => Prisma.raw(`'${f}'`)),
                        ", "
                    )})` : Prisma.empty}
                `;
            } else {
                where = Prisma.sql`
                    WHERE
                    (
                        "Manga"."id" = ${Number(id)}
                    )
                    ${format && format.length > 0 ? Prisma.sql`AND "Manga"."format" IN (${Prisma.join(
                        format.map(f => Prisma.raw(`'${f}'`)),
                        ", "
                    )})` : Prisma.empty}
                `;
            }

            let [count, results] = [0, []];
            if (type === Type.ANIME) {
                [count, results] = await prisma.$transaction([
                    prisma.$queryRaw`
                            SELECT COUNT(*) FROM "Anime"
                            ${where}
                        `,
                    prisma.$queryRaw`
                            SELECT * FROM "Anime"
                            ${where}
                        `,
                ]);
            } else {
                [count, results] = await prisma.$transaction([
                    prisma.$queryRaw`
                            SELECT COUNT(*) FROM "Manga"
                            ${where}
                        `,
                    prisma.$queryRaw`
                            SELECT * FROM "Manga"
                            ${where}
                        `,
                ]);
            }
            return results[0];
        }
    }

    public async getMalId(id:string): Promise<string> {
        if (this.isSQlite) {
            const c = new Promise((resolve, reject) => {
                this.db.all(`SELECT idMal FROM Anime WHERE id = ${id}`, (err, rows) => {
                    if (err) reject(err);
                    resolve(rows);
                });
            })
            const r = new Promise((resolve, reject) => {
                this.db.all(`SELECT idMal FROM Manga WHERE id = ${id}`, (err, rows) => {
                    if (err) reject(err);
                    resolve(rows);
                });
            });
            const [anime, manga]: any[] = await Promise.all([c, r]);

            if (anime.length > 0) {
                return anime[0].idMal.toString();
            } else if (manga.length > 0) {
                return manga[0].idMal.toString();
            } else {
                return '';
            }
        } else {
            const anime = await prisma.anime.findUnique({
                where: {
                    id: Number(id),
                },
            });
            const manga = await prisma.manga.findUnique({
                where: {
                    id: Number(id),
                },
            });

            if (anime) {
                return anime.idMal.toString();
            } else if (manga) {
                return manga.idMal.toString();
            } else {
                return '';
            }
        }
    }

    public async getMal(id:string, type:Type, format?:Format[]): Promise<FormattedResponse> {
        if (this.isSQlite) {
            let where = `
            WHERE
            (
                idMal = ${id}
            )
            ${format && format.length > 0 ? `AND "format" IN (${format.map(f => `'${f}'`).join(', ')})` : ''}
            `;

            const c = new Promise((resolve, reject) => {
                this.db.all(`SELECT COUNT(*) as count FROM ${type} ${where}`, (err, rows) => {
                    if (err) reject(err);
                    resolve(rows);
                });
            })
            const r = new Promise((resolve, reject) => {
                this.db.all(`SELECT * FROM ${type} ${where}`, (err, rows) => {
                    if (err) reject(err);
                    resolve(rows);
                });
            });
            const [results, count]: any[] = await Promise.all([r, c]);

            for (let i = 0; i < results.length; i++) {
                const row = results[i];
                row.title = JSON.parse(row.title);
                row.coverImage = JSON.parse(row.coverImage);
                row.startDate = JSON.parse(row.startDate);
                row.genres = JSON.parse(row.genres);
                row.synonyms = JSON.parse(row.synonyms);
                row.relations = JSON.parse(row.relations);
                row.streamingEpisodes = JSON.parse(row.streamingEpisodes);
                row.trailer = JSON.parse(row.trailer);
                row.connectors = JSON.parse(row.connectors);
                results[i] = row;
            }
            return results[0] as FormattedResponse;
        } else {
            const filter: any = { id: Number(id) };
            if (format) {
                filter.AND = format.map((format) => {
                    return { format: { contains: format } };
                });
            }

            let where: Prisma.Sql;
            if (type === Type.ANIME) {
                where = Prisma.sql`
                    WHERE
                    (
                        "Anime"."idMal" = ${Number(id)}
                    )
                    ${format && format.length > 0 ? Prisma.sql`AND "Anime"."format" IN (${Prisma.join(
                        format.map(f => Prisma.raw(`'${f}'`)),
                        ", "
                    )})` : Prisma.empty}
                `;
            } else {
                where = Prisma.sql`
                    WHERE
                    (
                        "Manga"."idMal" = ${Number(id)}
                    )
                    ${format && format.length > 0 ? Prisma.sql`AND "Manga"."format" IN (${Prisma.join(
                        format.map(f => Prisma.raw(`'${f}'`)),
                        ", "
                    )})` : Prisma.empty}
                `;
            }

            let [count, results] = [0, []];
            if (type === Type.ANIME) {
                [count, results] = await prisma.$transaction([
                    prisma.$queryRaw`
                            SELECT COUNT(*) FROM "Anime"
                            ${where}
                        `,
                    prisma.$queryRaw`
                            SELECT * FROM "Anime"
                            ${where}
                        `,
                ]);
            } else {
                [count, results] = await prisma.$transaction([
                    prisma.$queryRaw`
                            SELECT COUNT(*) FROM "Manga"
                            ${where}
                        `,
                    prisma.$queryRaw`
                            SELECT * FROM "Manga"
                            ${where}
                        `,
                ]);
            }
            return results[0];
        }
    }

    public async delete(id:string, type:Type): Promise<void> {
        if (this.isSQlite) {
            const stmt = await this.db.prepare(`DELETE FROM ${type.toLowerCase()} WHERE id = $id`);
            await stmt.run({
                $id: id,
            });
            console.log(colors.green(`Deleted ${type.toLowerCase()} with id ${id}`));
        } else {
            const db = type === Type.ANIME ? prisma.anime : prisma.manga;
            await db.delete({
                where: {
                    id: Number(id)
                }
            });
            console.log(colors.red(`Deleted`) + colors.blue(` ${type.toLowerCase()}`) + colors.red(` with id `) + colors.blue(`${id}`));
        }
    }

    public async insert(data:FormattedResponse[], type:Type): Promise<void> {
        const promises = [];
        for (let i = 0; i < data.length; i++) {
            const promise = new Promise(async(resolve, reject) => {
                if (!data[i]) {
                    resolve(true);
                    return;
                }
                const exists = await this.get(data[i].id, type);
                if (!exists) {
                    const db = type === Type.ANIME ? prisma.anime : prisma.manga;
                    if (this.isSQlite) {
                        const stmt = await this.db.prepare(`INSERT OR IGNORE INTO ${type.toLowerCase()}
                                (
                                    id, idMal, title, coverImage, bannerImage, startDate, description, season, seasonYear, type, format, status, genres, synonyms, source, meanScore, averageScore, relations, streamingEpisodes, trailer, connectors
                                )
                                VALUES
                                (
                                    $id, $idMal, $title, $coverImage, $bannerImage, $startDate, $description, $season, $seasonYear, $type, $format, $status, $genres, $synonyms, $source, $meanScore, $averageScore, $relations, $streamingEpisodes, $trailer, $connectors
                                )`);
                        await stmt.run({
                            $id: data[i].id,
                            $idMal: data[i].idMal,
                            $title: JSON.stringify(data[i].title),
                            $coverImage: JSON.stringify(data[i].coverImage),
                            $bannerImage: data[i].bannerImage,
                            $startDate: JSON.stringify(data[i].startDate),
                            $description: data[i].description ?? "",
                            $season: data[i].season,
                            $seasonYear: data[i].seasonYear,
                            $type: data[i].type,
                            $format: data[i].format ?? (type === Type.ANIME ? "TV" : "MANGA"),
                            $status: data[i].status ?? "FINISHED",
                            $genres: JSON.stringify(data[i].genres),
                            $synonyms: JSON.stringify(data[i].synonyms),
                            $source: data[i].source,
                            $meanScore: data[i].meanScore,
                            $averageScore: data[i].averageScore,
                            $relations: JSON.stringify(data[i].relations),
                            $streamingEpisodes: JSON.stringify(data[i].streamingEpisodes),
                            $trailer: JSON.stringify(data[i].trailer) ?? {},
                            $connectors: JSON.stringify(data[i].connectors)
                        });
                        await stmt.finalize();
    
                        if (this.config.debug) {
                            console.log(colors.white("Inserted ") + colors.blue(data[i].title.romaji) + " " + colors.white("into ") + colors.blue(type.toLowerCase()) + colors.white("."));
                        }
                    } else {
                        await db.create({
                            data: {
                                id: Number(data[i].id),
                                averageScore: data[i].averageScore,
                                bannerImage: data[i].bannerImage,
                                coverImage: data[i].coverImage,
                                description: data[i].description ?? "",
                                format: data[i].format ?? (type === Type.ANIME ? "TV" : "MANGA"),
                                idMal: data[i].idMal,
                                meanScore: data[i].meanScore,
                                relations: data[i].relations,
                                season: data[i].season,
                                seasonYear: data[i].seasonYear,
                                startDate: data[i].startDate,
                                source: data[i].source,
                                status: data[i].status ?? "FINISHED",
                                streamingEpisodes: data[i].streamingEpisodes,
                                title: data[i].title,
                                trailer: data[i].trailer ?? {},
                                type: data[i].type,
                                genres: data[i].genres,
                                synonyms: data[i].synonyms,
                                connectors: data[i].connectors
                            }
                        }).then(async() => {
                            if (this.config.debug) {
                                console.log(colors.white("Inserted ") + colors.blue(data[i].title.romaji) + " " + colors.white("into ") + colors.blue(type.toLowerCase()) + colors.white("."));
                            }
                        }).catch(async(err) => {
                            if (this.config.debug) {
                                console.log(colors.red(err.message));
                            }
                        })
                    }
                }
                resolve(true);
            })
            promises.push(promise);
        }

        await Promise.all(promises);
    }

    public async getAll(type:Type): Promise<FormattedResponse[]> {
        if (this.isSQlite) {
            return new Promise((resolve, reject) => {
                this.db.all(`SELECT * FROM ${type.toLowerCase()}`, (err, rows) => {
                    if (err) reject(err);
                    if (rows != undefined) {
                        for (let i = 0; i < rows.length; i++) {
                            const row = rows[i];
                            row.title = JSON.parse(row.title);
                            row.coverImage = JSON.parse(row.coverImage);
                            row.startDate = JSON.parse(row.startDate);
                            row.genres = JSON.parse(row.genres);
                            row.synonyms = JSON.parse(row.synonyms);
                            row.relations = JSON.parse(row.relations);
                            row.streamingEpisodes = JSON.parse(row.streamingEpisodes);
                            row.trailer = JSON.parse(row.trailer);
                            row.connectors = JSON.parse(row.connectors);
                            rows[i] = row;
                        }
                        resolve(rows);
                    } else {
                        resolve(null);
                    }
                });
            });
        } else {
            if (type === Type.ANIME) {
                return prisma.anime.findMany() as any;
            } else if (type === Type.MANGA) {
                return prisma.manga.findMany() as any;
            }
        }
    }

    public async export(): Promise<void> {
        let data:any = [];
        const dateAsString = new Date(Date.now()).toISOString().replace(/:/g, "-");
        const toExport = join(__dirname, "../../" + dateAsString + "-export.json");

        if (this.isSQlite) {
            const anime = await this.getAll(Type.ANIME);
            const manga = await this.getAll(Type.MANGA);
            data = {
                anime,
                manga
            };
        } else {
            const anime = await prisma.anime.findMany();
            const manga = await prisma.manga.findMany();
            data = {
                anime,
                manga
            };
        }
        writeFileSync(toExport, JSON.stringify(data, null, 4), "utf8");
        console.log(colors.white("Exported database to ") + colors.blue(toExport) + colors.white("."));
    }

    public async import(): Promise<void> {
        const exists = existsSync(join(__dirname, "../../export.json"));
        if (!exists) {
            console.log(colors.red("No export file found. Please make sure you have an export.json file in the root directory."));
            return;
        }
        const file = readFileSync(join(__dirname, "../../export.json"), "utf8");
        const data = JSON.parse(file);
        const anime:FormattedResponse[] = data.anime;
        const manga:FormattedResponse[] = data.manga;
        if (!anime || !manga) {
            console.log(colors.red("Invalid export file. Please make sure you have an export.json file in the root directory."));
            return;
        }
        await this.insert(anime, Type.ANIME);
        await this.insert(manga, Type.MANGA);
        if (this.config.debug) {
            console.log(colors.white("Imported database from ") + colors.blue("export.json"))
        }
    }
}