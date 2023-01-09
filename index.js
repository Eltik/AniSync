const AniSync = require("./built/AniSync").default;
const Anime = require("./built/providers/anime/Anime").default;
const a = new AniSync();
const b = new Anime("", "");
/*
a.search("gosick", "ANIME").then((data) => {
    console.log(data[0].anilist.title);
    b.insert(data).then(console.log);
})
*/
/*a.crawl("ANIME")*/
b.export().then(console.log)
/*
a.getTop("ANIME").then((data) => {
    console.log(data.length);
    b.insert(data).then(console.log);
});
*/