const AniSync = require("../built/AniSync").default;
let aniSync = new AniSync();
aniSync.crawl("MANGA").then(console.log);