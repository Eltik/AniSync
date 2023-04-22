const AniSync = require("../built/AniSync").default;
let aniSync = new AniSync();
aniSync.export().then(() => {
    // Finished
});