import { join } from "path";
import API, { ProviderType } from "../../API";
import { Database } from "sqlite3";
import { Result } from "../../AniSync";
import { createWriteStream } from "fs";

export default class Anime extends API {
    public baseUrl:string = undefined;
    public providerName:string = undefined;

    private db = new Database(join(__dirname, "../../db.db"));

    constructor(baseUrl:string, providerName:string) {
        super(ProviderType.ANIME);
        this.baseUrl = baseUrl;
        this.providerName = providerName;
    }

    public async search(any?): Promise<SearchResponse[]> {
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
                    const stmt = db.prepare("INSERT INTO anime(id, anilist, connectors) VALUES ($id, $anilist, $connectors)");
                    stmt.run({ $id: result.id, $anilist: JSON.stringify(result.anilist), $connectors: JSON.stringify(result.connectors) });
                    stmt.finalize();
                    console.log("Inserted " + result.anilist.title.english);
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
            db.get("SELECT * FROM anime WHERE id=?", [id], (err, rows) => {
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

    public async export(): Promise<String> {
        const all = await this.getAll();
        const output = join(__dirname, "../../../output.json");

        createWriteStream(output).write(JSON.stringify(all, null, 4));
        return output;
    }

    private async getAll(): Promise<Result[]> {
        const db = this.db;
        return new Promise((resolve, reject) => {
            db.all("SELECT * FROM anime", (err, rows) => {
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
}

export type { SearchResponse };