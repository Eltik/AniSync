const { Type, Format } = require("../built/meta/AniList");

const AniSync = require("../built/AniSync").default;
let aniSync = new AniSync();

aniSync.getAll(Type.MANGA).then(async(data) => {
    for (let i = 0; i < data.length; i++) {
        const manga = data[i];
        if (manga.format != Format.NOVEL) {
            await aniSync.delete(manga.id, Type.MANGA);
        }
    }
})