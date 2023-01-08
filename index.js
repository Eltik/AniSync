const ZoroTo = require("./built/providers/anime/ZoroTo").default;
const AniList = require("./built/AniList").default;
let a = new ZoroTo();
let b = new AniList("", "", "ANIME", "");

a.search("attack on titan season 2").then(async(data) => {
    const item1 = data[1];
    const searchReq = await b.search(item1.title, 0, 18, "ANIME", "TV");
    const item2 = searchReq.data.Page.media;

    let test = a.compare(item1, item2);
    console.log(test);
    console.log(test.media.title);
})