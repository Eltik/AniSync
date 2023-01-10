const Manga = require("../built/providers/manga/Manga").default;
const m = new Manga("", "");
m.export().then(console.log)