const Sync = require("./built/Sync").default;
let a = new Sync();
a.crawl("ANIME", 50).then(console.log);
/*
a.search("kubo won't let me be invisible", "ANIME").then((data) => {
    console.log(data);
    console.log("Finished!");
})
*/