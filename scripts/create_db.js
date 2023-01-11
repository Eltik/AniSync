const sqlite3 = require("sqlite3");
const config = require("../built/config.js").config;

const db = new sqlite3.Database(config.crawling.database_path);
const promises = [];
db.serialize(function() {
    const animePromise = new Promise((resolve, reject) => {
        db.run("CREATE TABLE IF NOT EXISTS anime (id INTEGER PRIMARY KEY, anilist longtext not null, connectors longtext not null)", function (err) {
            if (err) reject(err);
            console.log("Created table anime.");
            resolve(true);
        });
    })
    const mangaPromise = new Promise((resolve, reject) => {
        db.run("CREATE TABLE IF NOT EXISTS manga (id INTEGER PRIMARY KEY, anilist longtext not null, connectors longtext not null)", function (err) {
            if (err) reject(err);
            console.log("Created table manga.");
            resolve(true);
        });
    })
    promises.push(animePromise);
    promises.push(mangaPromise);
});

Promise.all(promises).then(() => {
    console.log("Successfully created tables.");
})