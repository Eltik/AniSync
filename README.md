# AniSync
Mapping sites to AniList and back.<br />
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
  provider: "Zoro",
  data {
    anime: {
      url: "https://zoro.to/one-piece-100?ref=search",
      id: "/one-piece-100?ref=search",
      img: "https://img.zorores.com/_r/300x400/100/54/90/5490cb32786d4f7fef0f40d7266df532/5490cb32786d4f7fef0f40d7266df532.jpg",
      title: "One Piece",
      romaji?: "ONE PIECE",
      native?: undefined
      // Some sites like Zoro don't provide the native (and sometimes romaji) title, so they may be left undefined.
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

## Crawling
Unfortunately, due to rate limits some functions such as fetching seasonal data can take ages (up to 18-20 seconds!). To get around this, a crawler has been added to AniSync. Just create an `AniSync` object and run `AniSync#crawl()`. All data will get stored in a database, and any search or fetch queries will be sent to that database instead of fetching new data (see documentation below). If you need the data as a JSON file, run `AniSync#export()` and an `output.json` file will be created. Note that since AniSync fetches almost all possible AniList queries, the file will be very large. You can configure the crawler in the `config.ts` file.

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
The `config.ts` file is a basic config file that changes how AniSync works. The mapping section contains the functions of mapping anime to AniList results. Each provider can have it's own value specified, but if it doens't exist it defaults to the `config.mapping.#` value rather than the `config.mapping.anime.[provider].#` value. The crawling section are the options used when crawling through AniList.

Mapping:
<table>
    <tr>
        <th>Field</th>
        <th>Description</th>
        <th>Default Value</th>
    </tr>
    <tr>
        <td>threshold</td>
        <td>The string comparison threshold at which to match a result. For example, GoSick vs GoSicko will return a threshold of about 0.98.</td>
        <td>0.8</td>
    </tr>
    <tr>
        <td>comparison_threshold</td>
        <td>If there are multiple names for a show (the romaji and native), the amount of successful threshold tests will be divided by the amount of tries. For example, if the name GoSick does not match My Hero Academia, the comparison threshold would be 0/1.</td>
        <td>0.8</td>
    </tr>
    <tr>
        <td>wait</td>
        <td>Amount of time to wait in milliseconds before sending another request. Used to avoid rate limits.</td>
        <td>200</td>
    </tr>
    <tr>
        <td>check_genres*</td>
        <td>Whether to map genres/check them.</td>
        <td>false</td>
    </tr>
</table>

CrunchyRoll Options

<table>
    <tr>
        <th>Field</th>
        <th>Description</th>
        <th>Default Value</th>
    </tr>
    <tr>
        <td>email</td>
        <td>Email to sign-in to CrunchyRoll.</td>
        <td>Empty String</td>
    </tr>
    <tr>
        <td>password</td>
        <td>Password to sign-in to CrunchyRoll.</td>
        <td>Empty String</td>
    </tr>
    <tr>
        <td>locale</td>
        <td>CrunchyRoll is funky and needs a locale to use. Must be a valid CrunchyRoll locale like en-US.</td>
        <td>en-US</td>
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
        <td>Next season's name (Spring/Winter).</td>
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
        <td>How long to wait in milliseconds between each page. Not the same as mapping wait limit.</td>
        <td>1000</td>
    </tr>
    <tr>
        <td>anime#max_pages</td>
        <td>Max amount of AniList pages to loop through.</td>
        <td>5</td>
    </tr>
</table>


*Unfinished

```typescript
export var config = {
    mapping: {
        threshold: 0.8,
        comparison_threshold: 0.8,
        wait: 200,
        check_genres: false,
        anime: {
            CrunchyRoll: {
                threshold: 0.95,
                comparison_threshold: 0.95,
                wait: 500,
                email: "",
                password: "",
                locale: "en-US"
            },
            Zoro: {
                threshold: 0.95,
                comparison_threshold: 0.95,
                wait: 200
            }
        },
        anilist: {
            SEASON: "WINTER",
            SEASON_YEAR: 2023,
            NEXT_SEASON: "SPRING",
            NEXT_YEAR: 2023
        }
    },
    crawling: {
        debug: true,
        anime: {
            wait: 1000,
            max_pages: 5
        }
    }
};
```

### Searching
It is recommended to use AniSync's search function over other functions. It is faster and captures more data than fetching seasonal data or using multiple crawler instances. How it works is by first searching on AniList, then searching on aggregators and matching each result together. For example, if a search request contains the query `GoSick`, a request will be made to AniList. AniList might return `Gundam`, `GoSick`, and `Goblin Slayer`. A search will then be made to all aggregators. If CrunchyRoll only returns `GoSick` and `Goblin Slayer`, its ID's will be matched to each AniList response like this:
```json
{
    "id": 12345,
    "idMal": 12345,
    "title": {
        "english": "GoSick",
        "romaji": "...",
        "native": "...",
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
This is the slowest function due to how it works (but it returns the most shows, so it's used for the `crawl()` function). Since there is no good way to map data from AniList, searching for each individual show on a provider is the best solution. How this function works is by first fetching seasonal data from AniList, then loop through the each show returned and search on all aggregators the English name of the show. For example, if Blue Lock is trending, a query will be submitted to each aggregator with the name, "Blue Lock." To fetch seasonal data, an `AniSync` object is required. Then just run `getTrending()`, `getPopular()`, etc. with a type as a parameter (`"ANIME"`, or `"MANGA"`).
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
Then, just add the connector to the `fetchData()` function in `AniSync.ts`:
```typescript
public async fetchData(...): Promise<AggregatorData[]> {
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