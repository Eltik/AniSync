const AniSync = require("./built/AniSync").default;
const Anime = require("./built/providers/anime/Anime").default;
const a = new AniSync();
const b = new Anime("", "");
a.search("test", "ANIME").then((data) => {
    b.insertAnime(data).then(console.log)
})