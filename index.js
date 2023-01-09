const AniSync = require("./built/AniSync").default;
const Manga = require("./built/providers/manga/Manga").default;
const a = new AniSync();
const b = new Manga("", "");
a.search("Martial", "MANGA").then((data) => {
    console.log(data[0].connectors)
})