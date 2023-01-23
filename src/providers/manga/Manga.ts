import { join } from "path";
import API, { ProviderType } from "../../API";
import { Database } from "sqlite3";
import { Result } from "../../AniSync";
import { createWriteStream } from "fs";
import { config } from "../../config";
import * as colors from "colors";

export default class Manga extends API {
    public baseUrl:string = undefined;
    public providerName:string = undefined;

    private db = new Database(config.crawling.database_path);

    constructor(baseUrl:string, providerName:string) {
        super(ProviderType.MANGA);
        this.baseUrl = baseUrl;
        this.providerName = providerName;
    }

    public async search(query?:string): Promise<SearchResponse[]> {
        throw new Error("Method not implemented.");
    }

    public async insert(results:Result[]): Promise<Boolean> {
        // CREATE TABLE anime(id int(7) NOT NULL, anilist longtext not null, connectors longtext not null);
        const db = this.db;
        const data = await this.getAll();
        try {
            for (let i = 0; i < results.length; i++) {
                const result = results[i];
                let canAdd = true;

                for (let j = 0; j < data.length; j++) {
                    if (data[j].id === result.id) {
                        canAdd = false;
                    }
                }

                if (canAdd) {
                    const stmt = db.prepare("INSERT INTO manga(id, anilist, connectors) VALUES ($id, $anilist, $connectors)");
                    stmt.run({ $id: result.id, $anilist: JSON.stringify(result.anilist), $connectors: JSON.stringify(result.connectors) });
                    stmt.finalize();

                    if (config.crawling.debug) {
                        console.log(colors.white("Inserted ") + colors.cyan(result.anilist.title.romaji) + colors.white(" into database."));
                    }
                }
            }
            return true;
        } catch(e) {
            console.error(e);
            return false;
        }
    }

    public async get(id:string): Promise<Result> {
        const db = this.db;
        return new Promise((resolve, reject) => {
            db.get("SELECT * FROM manga WHERE id=?", [id], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    if (rows != undefined) {
                        rows.anilist = JSON.parse(rows.anilist);
                        rows.connectors = JSON.parse(rows.connectors);
                        resolve(rows);
                    } else {
                        resolve(null);
                    }
                }
            });
        });
    }

    public async getTotal(): Promise<number> {
        const total = await this.getAll();
        return total.length;
    }

    public async export(): Promise<String> {
        const all = await this.getAll();
        const output = join(__dirname, "../../../output.json");

        createWriteStream(output).write(JSON.stringify(all, null, 4));
        return output;
    }

    public async clear(): Promise<void> {
        const db = this.db;
        const stmt = db.prepare("DELETE FROM manga");
        stmt.run();
        stmt.finalize();
    }

    private async getAll(): Promise<Result[]> {
        const db = this.db;
        return new Promise((resolve, reject) => {
            db.all("SELECT * FROM manga", (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    const results = [];
                    for (let i = 0; i < rows.length; i++) {
                        const row = rows[i];
                        results.push({
                            id: row.id,
                            anilist: JSON.parse(row.anilist),
                            connectors: JSON.parse(row.connectors)
                        });
                    }
                    resolve(results);
                }
            });
        });
    }
}

interface SearchResponse {
    url: string;
    id: string;
    img: string;
    title: string;
    romaji?: string;
    native?: string;
    year?: string;
    format?: string;
}

export type { SearchResponse };