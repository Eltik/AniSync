"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const API_1 = require("../../API");
const sqlite3_1 = require("sqlite3");
const fs_1 = require("fs");
const config_1 = require("../../config");
const colors = require("colors");
class Anime extends API_1.default {
    constructor(baseUrl, providerName) {
        super(API_1.ProviderType.ANIME);
        this.baseUrl = undefined;
        this.providerName = undefined;
        this.db = new sqlite3_1.Database(config_1.config.crawling.database_path);
        this.baseUrl = baseUrl;
        this.providerName = providerName;
    }
    async search(query) {
        throw new Error("Method not implemented.");
    }
    async insert(results) {
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
                    if (config_1.config.crawling.debug) {
                        console.log(colors.white("Inserted ") + colors.cyan(result.anilist.title.romaji) + colors.gray(" into database."));
                    }
                }
            }
            return true;
        }
        catch (e) {
            console.error(e);
            return false;
        }
    }
    async get(id) {
        const db = this.db;
        return new Promise((resolve, reject) => {
            db.get("SELECT * FROM anime WHERE id=?", [id], (err, rows) => {
                if (err) {
                    reject(err);
                }
                else {
                    if (rows != undefined) {
                        rows.anilist = JSON.parse(rows.anilist);
                        rows.connectors = JSON.parse(rows.connectors);
                        resolve(rows);
                    }
                    else {
                        resolve(null);
                    }
                }
            });
        });
    }
    async export() {
        const all = await this.getAll();
        const output = (0, path_1.join)(__dirname, "../../../output.json");
        (0, fs_1.createWriteStream)(output).write(JSON.stringify(all, null, 4));
        return output;
    }
    async getTotal() {
        const total = await this.getAll();
        return total.length;
    }
    async clear() {
        const db = this.db;
        const stmt = db.prepare("DELETE FROM anime");
        stmt.run();
        stmt.finalize();
    }
    async getAll() {
        const db = this.db;
        return new Promise((resolve, reject) => {
            db.all("SELECT * FROM anime", (err, rows) => {
                if (err) {
                    reject(err);
                }
                else {
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
exports.default = Anime;
//# sourceMappingURL=Anime.js.map