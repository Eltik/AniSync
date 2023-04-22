const AniSync = require("../built/AniSync").default;
let aniSync = new AniSync();
aniSync.crawl("ANIME").then(console.log);