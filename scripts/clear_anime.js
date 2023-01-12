const Anime = require("../built/providers/anime/Anime").default;
let anime = new Anime("", "");
const db = anime.db;
const promises = [];
db.serialize(function() {
    const promise = new Promise((resolve, reject) => {
        db.run("DELETE FROM anime;", function (err) {
            if (err) reject(err);
            console.log("Cleared all data from anime.");
            resolve(true);
        });
    })
    promises.push(promise);
});

Promise.all(promises).then(() => {
    console.log("Successfully cleared anime database.");
})