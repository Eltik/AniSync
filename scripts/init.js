const Sync = require("../built/Sync").default;
const aniSync = new Sync();
aniSync.init().then(() => {
    console.log("Done.");
});