const AniSync = require("./built/AniSync").default;
const Anime = require("./built/providers/anime/Anime").default;
const a = new AniSync();
const b = new Anime("", "");
a.search("my hero", "ANIME").then((data) => {
    console.log(data[0]);
    console.log(data[0].anilist.title)
    //b.insertAnime(data).then(console.log)
})