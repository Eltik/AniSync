const AniSync = require("./built/AniSync").default;
const Anime = require("./built/providers/anime/Anime").default;
const a = new AniSync();
const b = new Anime("", "");
a.search("my hero", "ANIME").then((data) => {
    data.map((element) => {
        console.log(element.connectors)
    })
    //b.insertAnime(data).then(console.log)
})