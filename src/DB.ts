import { FormattedResponse } from "./Sync";
import * as config from "./config.json";
import { Type } from "./meta/AniList";
import { Database } from "sqlite3";
import * as colors from "colors";
import API, { ProviderType } from "./API";
import { createWriteStream } from "fs";
import { join } from "path";

export default class DB extends API {
    private db = new Database(config.database_path);

    constructor() {
        super(ProviderType.NONE);
    }

    public async init() {
        await this.createDatabase();
    }

    private async createDatabase(): Promise<void> {
        const db = this.db;

        const promises = [];
        const anime = new Promise((resolve, reject) => {
            db.run("CREATE TABLE IF NOT EXISTS anime (id INTEGER PRIMARY KEY, data longtext not null, connectors longtext not null)", function (err) {
                if (err) reject(err);

                if (config.debug) {
                    console.log(colors.gray("Created ") + colors.blue("anime") + colors.gray(" table."));
                }
                resolve(true);
            });
        })
        const manga = new Promise((resolve, reject) => {
            db.run("CREATE TABLE IF NOT EXISTS manga (id INTEGER PRIMARY KEY, data longtext not null, connectors longtext not null)", function (err) {
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

    public async search(query:string, type:Type): Promise<FormattedResponse[]> {
        return new Promise(async(resolve, reject) => {
            const data = await this.getAll(type);
            if (!data) {
                resolve([]);
                return;
            }
            const results:FormattedResponse[] = [];
            for (let i = 0; i < data.length; i++) {
                const result:FormattedResponse = data[i];
                if (this.stringSearch(result.data.title.english ?? "", query) >= 1 || this.stringSearch(result.data.title.romaji ?? "", query) >= 1 || this.stringSearch(result.data.title.native ?? "", query) >= 1) {
                    results.push(result);
                }
            }
            resolve(results);
        });
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
                    const stmt = await this.db.prepare(`INSERT OR IGNORE INTO ${type.toLowerCase()} (id, data, connectors) VALUES ($id, $data, $connectors)`);
                    await stmt.run({ $id: data[i].id, $data: JSON.stringify(data[i].data), $connectors: JSON.stringify(data[i].connectors) });
                    await stmt.finalize();

                    if (config.debug) {
                        console.log(colors.white("Inserted ") + colors.blue(data[i].data.title.romaji) + " " + colors.white("into ") + colors.blue(type.toLowerCase()) + colors.white("."));
                    }
                }
                resolve(true);
            })
            promises.push(promise);
        }

        await Promise.all(promises);
    }

    public async get(id:string, type:Type): Promise<FormattedResponse> {
        return new Promise((resolve, reject) => {
            this.db.get(`SELECT * FROM ${type.toLowerCase()} WHERE id = ${id}`, (err, row) => {
                if (err) reject(err);
                if (row != undefined) {
                    row.data = JSON.parse(row.data);
                    row.connectors = JSON.parse(row.connectors);
                    resolve(row);
                } else {
                    resolve(null);
                }
            });
        });
    }

    public async getAll(type:Type): Promise<FormattedResponse[]> {
        return new Promise((resolve, reject) => {
            this.db.all(`SELECT * FROM ${type.toLowerCase()}`, (err, rows) => {
                if (err) reject(err);
                if (rows != undefined) {
                    for (let i = 0; i < rows.length; i++) {
                        rows[i].data = JSON.parse(rows[i].data);
                        rows[i].connectors = JSON.parse(rows[i].connectors);
                    }
                    resolve(rows);
                } else {
                    resolve(null);
                }
            });
        });
    }

    public async export(type:Type): Promise<void> {
        const all = await this.getAll(type);
        createWriteStream(join(config.export_path, type + ".json")).write(JSON.stringify(all, null, 4));
    }
}