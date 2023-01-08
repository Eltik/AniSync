const AniSync = require("./built/AniSync").default;
const a = new AniSync();
a.search("test", "ANIME").then((data) => {
    console.log(data[0]);
})