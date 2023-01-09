const AniSync = require("./built/AniSync").default;
const a = new AniSync();
a.search("The Angel Next Door", "MANGA").then((data) => {
    console.log(data[0].connectors)
})