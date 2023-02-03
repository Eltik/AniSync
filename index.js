const Sync = require("./built/Sync").default;
let a = new Sync();
a.crawl("ANIME").then(console.log)