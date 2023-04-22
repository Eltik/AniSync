const { Type, Format } = require("../built/meta/AniList");

const AniSync = require("../built/AniSync").default;
let aniSync = new AniSync();

aniSync.getAll(Type.MANGA).then(async(data) => {
    for (let i = 0; i < data.length; i++) {
        const novel = data[i];
        if (novel.format === Format.NOVEL) {
            await aniSync.delete(novel.id, Type.MANGA);
        }
    }
})