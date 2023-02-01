# AniSync
Mapping sites to AniList and back.<br />
Inspired by MalSync, this project is made for taking search queries from popular tracking sites such as [AniList](https://anilist.co) and matching them with sites such as [Zoro.To](https://zoro.to/), [AnimeFox](https://animefox.tv/), and more.<br />

## How it Works
The concept of AniSync is relatively simple. Using a string similarity algorithm ([Dice's Coefficient](https://en.wikipedia.org/wiki/S%C3%B8rensen%E2%80%93Dice_coefficient), courtesy of the NPM package [string-similarity](https://www.npmjs.com/package/string-similarity)), AniSync first sends a request to all providers. Then looping through each result, the title is then "sanitized" and a request with that title is sent to AniList. AniSync will then compare each title and find the best result that matches the provider's result and map it to AniList.
If the comparison succeeds, it will return this:
```json
[
    {
        "id": 21,
        "data": {
            "id": 21,
            "idMal": 21,
            "title": {
                "romaji": "ONE PIECE",
                "english": "ONE PIECE",
                "native": "ONE PIECE"
            },
            ...
        },
        "connectors": [
            {
                "provider": "AnimePahe",
                "data": {
                    "id": "c9bf6e84-c3e0-01b8-2bd7-c2fbfc7431a1",
                    "title": "One Piece",
                    "img": "https://i.animepahe.com/posters/355e6e3127aa31f0d806114169b52c4fb6da4b87df7f9c1809b9e3de97b8aac5.jpg",
                    "url": "https://animepahe.com/anime/c9bf6e84-c3e0-01b8-2bd7-c2fbfc7431a1"
                },
                "comparison": 1
            },
                        {
                "provider": "Kitsu",
                "data": {
                    "id": "12",
                    "romaji": "One Piece",
                    "native": "ONE PIECE",
                    "img": "https://media.kitsu.io/anime/poster_images/12/original.png",
                    "url": "https://kitsu.io/api/edge/anime/12"
                },
                "comparison": 1
            },
            {
                "provider": "GogoAnime",
                "data": {
                    "url": "https://www1.gogoanime.bid/category/one-piece",
                    "id": "/category/one-piece",
                    "img": "https://gogocdn.net/images/anime/One-piece.jpg",
                    "romaji": "One Piece"
                },
                "comparison": 1
            },
                        {
                "provider": "AnimeFox",
                "data": {
                    "url": "https://animefox.tv/anime/one-piece",
                    "id": "/anime/one-piece",
                    "img": "TV Series",
                    "romaji": "One Piece"
                },
                "comparison": 1
            }
        ]
    }
]
```

## Contributing
Contribution would very much be appreciated. If you have any suggestions or requests, create a [pull request](https://github.com/Eltik/AniSync/pulls) or [issue](https://github.com/Eltik/AniSync/issues). Adding other "connectors" or sites such as [TVDB](https://thetvdb.com/), [MyAnimeList](https://myanimelist.net/), [4anime](https://4anime.gg/), etc. is super easy. The only thing required would be to create a new file under `/[anime/manga]` and add the `search()` function:
```typescript
export default class FourAnime extends Provider {
  constructor() {
    super("https://4anime.gg", ProviderType.ANIME);
  }
  
  public async search(query:string): Promise<Array<SearchResponse>> {
    ...
  }
}
```
Then, just add the connector to the `classDictionary` variable in `AniSync.ts`:
```typescript
export default class AniSync extends API {
    constructor() {
        super(...);

        ...
        this.classDictionary = [
            {
                name: "TMDB",
                object: new TMDB()
            },
            ...
            {
                name: "FourAnime",
                object: new FourAnime()
            }
        ]
    }
}
```
That's it! Feedback would be appreciated...

## Providers
<table>
    <tr>
        <th>Name</th>
        <th>Link</th>
        <th>Notes</th>
    </tr>
    <tr>
        <td>Zoro.To</td>
        <td><a href="https://zoro.to/">Link</a></td>
        <td>N/A</td>
    </tr>
    <tr>
        <td>GogoAnime</td>
        <td><a href="https://www.gogoanime.dk/">Link</a></td>
        <td>N/A</td>
    </tr>
    <tr>
        <td>AnimeFox</td>
        <td><a href="https://animefox.tv/">Link</a></td>
        <td>N/A</td>
    </tr>
    <tr>
        <td>AnimePahe</td>
        <td><a href="https://animepahe.com/">Link</a></td>
        <td>N/A</td>
    </tr>
    <tr>
        <td>Enime</td>
        <td><a href="https://enime.moe/">Link</a></td>
        <td>N/A</td>
    </tr>
    <tr>
        <td>ComicK</td>
        <td><a href="https://comick.app/">Link</a></td>
        <td>N/A</td>
    </tr>
    <tr>
        <td>MangaDex</td>
        <td><a href="https://mangadex.org/">Link</a></td>
        <td>N/A</td>
    </tr>
    <tr>
        <td>Mangakakalot</td>
        <td><a href="https://mangakakalot.com/">Link</a></td>
        <td>N/A</td>
    </tr>
    <tr>
        <td>TVDB</td>
        <td><a href="https://thetvdb.com/">Link</a></td>
        <td>Meta</td>
    </tr>
    <tr>
        <td>4anime*</td>
        <td><a href="https://4anime.gg/">Link</a></td>
        <td>N/A</td>
    </tr>
    <tr>
        <td>9anime*</td>
        <td><a href="https://9anime.pl/">Link</a></td>
        <td>Requires special keys/mapping</td>
    </tr>
    <tr>
        <td>MyAnimeList*</td>
        <td><a href="https://myanimelist.com/">Link</a></td>
        <td>Meta</td>
    </tr>
</table>
*Not finished yet.