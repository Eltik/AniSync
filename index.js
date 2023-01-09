const AniSync = require("./built/AniSync").default;
const a = new AniSync();
/*
a.search("my hero", "ANIME").then((data) => {
    console.log(data);
})
*/
a.getTrending("ANIME").then((data) => {
    console.log(data);
});