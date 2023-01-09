const AniSync = require("./built/AniSync").default;
const aniSync = new AniSync();
aniSync.search("my hero", "ANIME").then((data) => {
    data.map((element) => {
        console.log(element.connectors);
        console.log(element.anilist.title);
    })
})