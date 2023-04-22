const { Type } = require("../built/meta/AniList");

const AniSync = require("../built/AniSync").default;

const aniSync = new AniSync();
aniSync.getAll(Type.ANIME).then(async(data) => {
    for (let i = 0; i < data.length; i++) {
        const anime = data[i];
        await aniSync.delete(anime.id, Type.ANIME);
    }
})