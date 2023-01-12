const Manga = require("../built/providers/manga/Manga").default;
let manga = new Manga("", "");
const db = manga.db;
const promises = [];
db.serialize(function() {
    const promise = new Promise((resolve, reject) => {
        db.run("DELETE FROM manga;", function (err) {
            if (err) reject(err);
            console.log("Cleared all data from manga.");
            resolve(true);
        });
    })
    promises.push(promise);
});

Promise.all(promises).then(() => {
    console.log("Successfully cleared manga database.");
})