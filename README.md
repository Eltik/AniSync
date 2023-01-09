# AniSync
Mapping sites to AniList and back!<br />
Inspired by MalSync, this project is made for taking search queries from popular tracking sites such as [AniList](https://anilist.co) and matching them with sites such as [Zoro.To](https://zoro.to/), [CrunchyRoll](https://crunchyroll.com/), and more.

## How it Works
The concept of AniSync is relatively simple. Using a string similarity algorithm ([Dice's Coefficient](https://en.wikipedia.org/wiki/S%C3%B8rensen%E2%80%93Dice_coefficient), courtesy of the NPM package [string-similarity](https://www.npmjs.com/package/string-similarity)), AniSync sends a search request first to AniList and then to other anime streaming sites. Looping through each result, a function is run to check the similarity between the native, romaji, and english title of the show:
```typescript
public async search(query:string, type:Type["ANIME"]|Type["MANGA"]) {
  ...
  const aniListData = [];
  const zoroToData = [];
  zoroToData.map((show) => {
    const data = this.compareAnime(show, aniListData);
    // If there is a result, it will return an object
  });
}
```
If the comparison succeeds, it will return this:
```javascript
{
  provider: "ZoroTo",
  data {
    anime: {
      url: "https://zoro.to/one-piece-100?ref=search",
      id: "/one-piece-100?ref=search",
      img: "https://img.zorores.com/_r/300x400/100/54/90/5490cb32786d4f7fef0f40d7266df532/5490cb32786d4f7fef0f40d7266df532.jpg",
      title: "One Piece",
      romaji?: "ONE PIECE",
      native?: undefined
      // Some sites like Zoro.To don't provide the native (and sometimes romaji) title, so they may be left undefined.
    },
    media: {
      // AniList data. There's a lot, but it's pretty self-explanatory.
      id: 21,
      idMal: 21,
      siteUrl: "https://anilist.co/anime/21/ONE-PIECE/",
      title: { english?: "ONE PIECE", romaji?: "ONE PIECE", native?: "ONE PIECE" }
      ...
    }
  }
}
```
To avoid insane amount of requests to each site, data will likely need to be stored in a database or JSON file to be "cached." This feature is still in development, so stay tuned for more.

## Contributing
Contribution would very much be appreciated. If you have any suggestions or requests, create a [pull request](https://github.com/Eltik/AniSync/pulls) or [issue](https://github.com/Eltik/AniSync/issues). Adding other "connectors" or sites such as [TVDB](https://thetvdb.com/), [MyAnimeList(https://myanimelist.net/), [4anime](https://4anime.gg/), etc. is super easy. The only thing required would be to create a new file under `/providers/[anime/manga]` and add the `search()` function:
```typescript
export default class FourAnime extends Anime {
  constructor() {
    super("https://4anime.gg", "4anime");
  }
  
  public async search(query:string): Promise<Array<SearchResponse>> {
    ...
  }
}
```
Then, just add the connector to the `search()` function in `AniSync.ts`:
```typescript
public async search(...): Promise<Search[]> {
  ...
  if (type === "ANIME") {
    const zoro = new ZoroTo();
    const fourAnime = new FourAnime();
    ...
    const zoroPromise = new Promise((resolve, reject) => {
        zoro.search(query).then((results) => {
            aggregatorData.push({
                provider_name: zoro.providerName,
                results: results
            });
            resolve(aggregatorData);
        }).catch((err) => {
            reject(err);
        });
    })
    const fourPromise = new Promise((resolve, reject) => {
        fourAnime.search(query).then((results) => {
            aggregatorData.push({
                provider_name: fourAnime.providerName,
                results: results
            });
            resolve(aggregatorData);
        }).catch((err) => {
            reject(err);
        });
    })
    ...
  } else ...
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
        <td><img src="https://zoro.to/images/logo.png" style="width:50%"></img></td>
        <td><a href="https://zoro.to/">Link</a></td>
        <td>N/A</td>
    </tr>
    <tr>
        <td><img src="https://logodownload.org/wp-content/uploads/2020/02/crunchyroll-logo-2.png" style="width:50%"></img></td>
        <td><a href="https://www.crunchyroll.com/">Link</a></td>
        <td>Requires an account (see config file)</td>
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
        <td>TVDB*</td>
        <td><a href="https://thetvdb.com/">Link</a></td>
        <td>Meta</td>
    </tr>
    <tr>
        <td>MyAnimeList*</td>
        <td><a href="https://myanimelist.com/">Link</a></td>
        <td>Meta</td>
    </tr>
</table>
*Not finished yet.
