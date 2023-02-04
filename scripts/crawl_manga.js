const Sync = require("../built/Sync").default;
let aniSync = new Sync();
aniSync.crawl("ANIME").then(console.log);