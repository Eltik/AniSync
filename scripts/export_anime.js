const Anime = require("../built/providers/anime/Anime").default;
const a = new Anime("", "");
a.export().then(console.log)