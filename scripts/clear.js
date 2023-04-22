const AniSync = require("../built/AniSync").default;
const aniSync = new AniSync();
aniSync.clearDatabase().then(() => {
    // Finished
})