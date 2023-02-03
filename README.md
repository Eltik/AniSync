# AniSync
Mapping sites to AniList and back.<br />
Inspired by MalSync, this project is made for taking search queries from popular tracking sites such as [AniList](https://anilist.co) and matching them with sites such as [Zoro.To](https://zoro.to/), [AnimeFox](https://animefox.tv/), and more.<br />

## How it Works
The concept of AniSync is relatively simple. Using a string similarity algorithm ([Dice's Coefficient](https://en.wikipedia.org/wiki/S%C3%B8rensen%E2%80%93Dice_coefficient), courtesy of the NPM package [string-similarity](https://www.npmjs.com/package/string-similarity)), AniSync first sends a request to AniList and then to all providers. Then, a comparison will be started between the title of the AniList result and the provider's result. AniSync will then try and find the best result and return it. This process is ran twice: once for sending a request to AniList and once for sending a request to the providers. This is done to ensure that the best result is returned. If you are confused, take a look at the `search()` function in the `Sync.ts` file.
```typescript
export default class Sync extends API {
    /**
     * @description Searches on AniList and on providers and finds the best results possible.
     * @param query Media to search for.
     * @param type Type of media to search for.
     * @returns Promise<FormattedResponse[]>
     */
    public async search(query:string, type:Type): Promise<FormattedResponse[]> {
        let result:FormattedResponse[] = [];
        // Searches first on the database for a result
        const possible = await this.db.search(query, type);
        if (!possible || possible.length === 0) {
            if (config.debug) {
                console.log(colors.yellow("No results found in database. Searching providers..."));
                console.log(colors.gray("Searching for ") + colors.blue(query) + colors.gray(" of type ") + colors.blue(type) + colors.gray("..."));
            }
            // Search on AniList first
            const aniSearch = await this.aniSearch(query, type);
            if (config.debug) {
                console.log(colors.gray("Received ") + colors.blue("AniList") + colors.gray(" response."));
            }
            const aniList = this.searchCompare(result, aniSearch);
            // Then search on providers
            const pageSearch = await this.pageSearch(query, type);
            if (config.debug) {
                console.log(colors.gray("Received ") + colors.blue("Provider") + colors.gray(" response."));
            }
            // Find the best results possible
            const pageList = this.searchCompare(aniList, pageSearch, 0.5);
            await this.db.insert(pageList, type);
            return pageList;
        } else {
            return possible;
        }
    }
}
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
        <td>TVDB*</td>
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