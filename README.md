# AniSync
Mapping sites to AniList and back.<br />
Inspired by MalSync, this project is made for taking search queries from popular tracking sites such as [AniList](https://anilist.co) and matching them with sites such as [Zoro.To](https://zoro.to/), [CrunchyRoll](https://crunchyroll.com/), and more.<br />

## How it Works
The concept of AniSync is relatively simple. Using a string similarity algorithm ([Dice's Coefficient](https://en.wikipedia.org/wiki/S%C3%B8rensen%E2%80%93Dice_coefficient), courtesy of the NPM package [string-similarity](https://www.npmjs.com/package/string-similarity)), AniSync sends a search request first to AniList and then to other anime streaming sites. Looping through each result, a function is run to check the similarity between the native, romaji, and english title of the show:
```typescript
// Returns Promise<Result[]>
public async search(query, type) {
    // AniList search result data
    const aniData:Media[] = [];
    ...
    
    // Data searched on aggregators like Zoro, GogoAnime, etc.
    const aggregatorData:AggregatorData[] = await this.fetchData(query, type);

    // An array of search data that is filtered based on whether
    // the result matches the threshold.
    const comparison:Search[] = [];
    
    aggregatorData.map((result, index) => {
        const provider = result.provider_name;
        const results = result.results;

        for (let i = 0; i < results.length; i++) {
            // Compares each result.
            const data = this.compare(results[i], aniData, config.mapping.provider[provider]?.threshold, config.mapping.provider[provider]?.comparison_threshold);
            if (data != undefined) {
                comparison.push({
                    provider,
                    data
                });
            }
        }
    });

    // Convert search data into a better format
    const result = this.formatData(comparison);
    return result;
}
```
If the comparison succeeds, it will return this:
```json
[
    {
        "id": 21,
        "anilist": {
            "id": 21,
            "idMal": 21,
            "title": {
                "romaji": "ONE PIECE",
                "english": "ONE PIECE",
                "native": "ONE PIECE"
            },
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
To avoid insane amount of requests to each site, data is stored in a local SQLite database which is searched first before sending data to other sites. There is a CLI (see below) for exporting and managing the database.

## Crawling
Unfortunately, due to rate limits some functions such as fetching seasonal data can take ages (up to 18-20 seconds!). To get around this, a crawler has been added to AniSync. Just create an `AniSync` object and run `AniSync#crawl()` or use the CLI. All data will get stored in a database, and any search or fetch queries will be sent to that database instead of fetching new data (see documentation below). If you need the data as a JSON file, run `AniSync#export()` and an `output.json` file will be created. Note that since AniSync fetches almost all possible AniList queries, the file will be very large. You can configure the crawler in the `config.ts` file.

## CLI
A CLI has been added for quick features such as searching, exporting, crawling, etc. Run the command below to access the command line and follow the directions prompted.
```
npm run cli
```
Or:
```
node ./built/cli/cli.js
```

## Web Server
A very basic web server has been added if you want to test or have an example of how to use AniSync as an API. To run the server, run the command below and go to `localhost:3000` in your browser.
```
npm run start
```
Or:
```
node ./built/server.js
```

## Documentation
This project is meant to be a scalable database like MALSync, meaning you can create your own database of anime with direct streaming links to other sites. As of now, when you search for shows or get data from AniList, AniSync will <b>first search the created database</b> and <i>then</i> on streaming sites. This means that if you were to query trending shows on AniList, if there are <b>any shows on that list</b> that are stored in the database, <b>no requests will be made to streaming sites</b>. For example, if Attack on Titan, Demon Slayer, and Blue Lock are currently trending, but only Blue Lock is stored in the database, no requests will be made to find Attack on Titan and Demon Slayer, and Blue Lock will be returned. However, if you search specifically for Attack on Titan, Blue Lock won't be found and Attack on Titan will be stored. Now, with that out of the way, here is the documentation.

### Installation
AniSync requires at least NodeJS `v12.20.0` <i>(untested)</i> and TypeScript `^v4.9.4` <i>(untested)</i>. If the version changes, please open a GitHub [issue](https://github.com/Eltik/AniSync/issues) and I will update the `README.md`. To install AniSync, clone the GitHub repository or use NPM (automatically installed with Node).
```
git clone https://github.com/Eltik/AniSync.git
npm install anisync
```
#### Building the Project
A built version of AniSync should be on the pre-installed version. However, if you wish to rebuild the project, clone the repository and run the commands below:
```
npm run clean
npm install
npm run build
```
This will clean the build folder and re-install the required modules. Cleaning the build folder does not delete the database file, but rather cleans all built files in the `/src` folder.

### Configuration
The `config.ts` file is a basic config file that changes how AniSync works. The mapping section contains the functions of mapping anime to AniList results. Each provider can have it's own value specified, but if it doens't exist it defaults to the `config.mapping.#` value rather than the `config.mapping.provider.[provider].#` value. The crawling section are the options used when crawling through AniList.

Web Server:
<table>
    <tr>
        <th>Field</th>
        <th>Description</th>
        <th>Default Value</th>
    </tr>
    <tr>
        <td>use_http</td>
        <td>Whether to use http only requests (ex. http://graphql.anilist.co).</td>
        <td>false</td>
    </tr>
    <tr>
        <td>port</td>
        <td>The port of the web server.</td>
        <td>3000</td>
    </tr>
    <tr>
        <td>cors</td>
        <td>An array of acceptable cors sites.</td>
        <td>["*"]</td>
    </tr>
</table>

Mapping:
<table>
    <tr>
        <th>Field</th>
        <th>Description</th>
        <th>Default Value</th>
    </tr>
    <tr>
        <td>threshold</td>
        <td>The string comparison threshold at which to match a search result.</td>
        <td>0.8</td>
    </tr>
    <tr>
        <td>comparison_threshold</td>
        <td>The string comparison threshold for matching the final result.</td>
        <td>0.8</td>
    </tr>
    <tr>
        <td>wait</td>
        <td>Amount of time to wait in milliseconds before sending another request. Used to avoid rate limits.</td>
        <td>200</td>
    </tr>
    <tr>
        <td>search_partial</td>
        <td>Whether to break-up a search by spaces or not.</td>
        <td>false</td>
    </tr>
    <tr>
        <td>partial_amount</td>
        <td>The amount to divide a search by.</td>
        <td>1</td>
    </tr>
</table>

AniList Options
<table>
    <tr>
        <th>Field</th>
        <th>Description</th>
        <th>Default Value</th>
    </tr>
    <tr>
        <td>SEASON</td>
        <td>Current airing season name (Spring/Winter).</td>
        <td>Depends.</td>
    </tr>
    <tr>
        <td>SEASON_YEAR</td>
        <td>Current airing season year.</td>
        <td>Depends.</td>
    </tr>
    <tr>
        <td>NEXT_SEASON</td>
        <td>Next season's name.</td>
        <td>Depends.</td>
    </tr>
    <tr>
        <td>NEXT_YEAR</td>
        <td>Next season's year.</td>
        <td>Depends.</td>
    </tr>
</table>

Crawling:
<table>
    <tr>
        <th>Field</th>
        <th>Description</th>
        <th>Default Value</th>
    </tr>
    <tr>
        <td>debug</td>
        <td>Whether to log debug options or not.</td>
        <td>true</td>
    </tr>
    <tr>
        <td>anime#wait</td>
        <td>How long to wait in milliseconds between each page.</td>
        <td>1000</td>
    </tr>
    <tr>
        <td>anime#max_pages</td>
        <td>Max amount of AniList pages to loop through.</td>
        <td>2</td>
    </tr>
        <tr>
        <td>anime#start</td>
        <td>Which page to start crawling from.</td>
        <td>0</td>
    </tr>
</table>

### Searching
It is recommended to use AniSync's search function over other functions. It is faster and captures more data than fetching seasonal data or using multiple crawler instances. How it works is by first searching on AniList, then searching on aggregators and matching each result together. For example, if a search request contains the query `GoSick`, a request will be made to AniList. AniList might return `Gundam`, `GoSick`, and `Goblin Slayer`. A search will then be made to all aggregators. If CrunchyRoll only returns `GoSick` and `Goblin Slayer`, its ID's will be matched to each AniList response like this:
```json
{
    "id": 12345,
    "anilist": {
        "title": {
            "english": "GoSick",
            "romaji": "...",
            "native": "...",
        },
    },
    ...
    {
        "connectors": [
            {
                "provider": "CrunchyRoll",
                "data": {
                    "url": "https://www.crunchyroll.com/series/G47G3A",
                    "id": "/series/G47G3A",
                    "img": "https://www.crunchyroll.com/image/some_image_id.jpg",
                    "title": "GoSick"
                }
            }
            ...
        ]
    }
}
```
On a coding level, to use the search function simply create an AniSync object:
```javascript
// ES Module
import AniSync from "anisync";

// CommonJS Module
const AniSync = require("anisync").default;

const aniSync = new AniSync();
```
Then, run the `search()` function and input the query and type (either `"ANIME"` or `"MANGA"`):
```javascript
// Returns Promise<Result[]>
await aniSync.search("My Hero Acadamia season 2", "ANIME");
```

### Fetching Trending Data
This is the slowest function due to how it works. Since there is no good way to map data from AniList, searching for each individual show on a provider is the best solution. How this function works is by first fetching seasonal data from AniList, then loop through the each show returned and search on all aggregators the English name of the show. For example, if Blue Lock is trending, a query will be submitted to each aggregator with the name, "Blue Lock." To fetch seasonal data, an `AniSync` object is required. Then just run `getTrending()`, `getPopular()`, etc. with a type as a parameter (`"ANIME"`, or `"MANGA"`).
```javascript
const aniSync = new AniSync();

// All of these functions return Promise<Result[]>
await aniSync.getTrending("ANIME");
await aniSync.getSeason("ANIME");
await aniSync.getPopular("ANIME");
await aniSync.getTop("ANIME");
await aniSync.getNextSeason("ANIME"); // Will likely return nothing since providers won't have shows available yet
```

### Functions List
The following are all functions mentioned above and other functions that may have an use case, but are not extremely important.
<table>
    <tr>
        <th>Code</th>
        <th>Description</th>
        <th>Returns</th>
    </tr>
    <tr>
        <td>AniSync#search(query:string, type:Type["ANIME"]|Type["MANGA"])</td>
        <td>Searches for shows on AniList and attempts to map the results to providers.</td>
        <td>Promise#Result[]</td>
    </tr>
    <tr>
        <td>AniSync#crawl(type:Type["ANIME"]|Type["MANGA"], maxPages?:number, wait?:number)</td>
        <td>Crawls through the trending section of AniList (likely will change it to any section).</td>
        <td>Promise#void</td>
    </tr>
    <tr>
        <td>AniSync#getTrending(type:Type["ANIME"]|Type["MANGA"])</td>
        <td>Maps AniList's trending page to providers.</td>
        <td>Promise#Result[]</td>
    </tr>
    <tr>
        <td>AniSync#getSeason(type:Type["ANIME"]|Type["MANGA"])</td>
        <td>Maps AniList's seasonal page to providers.</td>
        <td>Promise#Result[]</td>
    </tr>
    <tr>
        <td>AniSync#getPopular(type:Type["ANIME"]|Type["MANGA"])</td>
        <td>Maps AniList's popular page to providers.</td>
        <td>Promise#Result[]</td>
    </tr>
    <tr>
        <td>AniSync#getTop(type:Type["ANIME"]|Type["MANGA"])</td>
        <td>Maps AniList's top page to providers.</td>
        <td>Promise#Result[]</td>
    </tr>
    <tr>
        <td>AniSync#getNextSeason(type:Type["ANIME"]|Type["MANGA"])</td>
        <td>Maps AniList's next-season page to providers (*season can be configured in config file).</td>
        <td>Promise#Result[]</td>
    </tr>
    <tr>
        <td>AniSync#getTop(type:Type["ANIME"]|Type["MANGA"])</td>
        <td>Maps AniList's top page to providers.</td>
        <td>Promise#Result[]</td>
    </tr>
    <tr>
        <td>AniSync#getTop(type:Type["ANIME"]|Type["MANGA"])</td>
        <td>Maps AniList's top page to providers.</td>
        <td>Promise#Result[]</td>
    </tr>
    <tr>
        <td>Anime#insert(results:Result[])</td>
        <td>Inserts results into a database.</td>
        <td>Promise#Boolean</td>
    </tr>
    <tr>
        <td>Anime#get(id:string)</td>
        <td>Fetches a show from the database based on the AniList ID.</td>
        <td>Promise#Result</td>
    </tr>
        <tr>
        <td>Anime#export()</td>
        <td>Exports the database into a JSON file named output.json.</td>
        <td>Promise#void</td>
    </tr>
</table>

### Types
```typescript
interface Search {
    provider: string;
    data: ComparisonData;
}

interface Result {
    id: number;
    anilist: Media; // AniList object. See https://anilist.co/graphiql
    connectors: [
        {
            provider: string;
            data: SearchResponse;
            comparison: number;
        }
    ];
}

interface ComparisonData {
    result: SearchResponse;
    media: Media;
    comparison: number;
}

interface AggregatorData {
    provider_name: string;
    results: SearchResponse[]
}

interface Mapping {
    title?: string;
    romaji?: string;
    native?: string;
    genres?: string[];
}

interface Provider {
    name: string;
    object: any;
}
```

## Contributing
Contribution would very much be appreciated. If you have any suggestions or requests, create a [pull request](https://github.com/Eltik/AniSync/pulls) or [issue](https://github.com/Eltik/AniSync/issues). Adding other "connectors" or sites such as [TVDB](https://thetvdb.com/), [MyAnimeList](https://myanimelist.net/), [4anime](https://4anime.gg/), etc. is super easy. The only thing required would be to create a new file under `/providers/[anime/manga]` and add the `search()` function:
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
Then, just add the connector to the `classDictionary` variable in `AniSync.ts`:
```typescript
export default class AniSync extends API {
    constructor() {
        super(...);

        const fourAnime = new FourAnime();
        ...
        this.classDictionary = [
            {
                name: tmdb.providerName,
                object: tmdb
            },
            ...
            {
                name: fourAnime.providerName,
                object: fourAnime
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
        <td>CrunchyRoll</td>
        <td><a href="https://www.crunchyroll.com/">Link</a></td>
        <td>Requires an account (see config file)</td>
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