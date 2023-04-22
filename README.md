# AniSync
Mapping sites to AniList and back.<br />
Inspired by MalSync, this project is made for taking search queries from popular tracking sites such as [AniList](https://anilist.co) and matching them with sites such as [Zoro.To](https://zoro.to/), [AnimeFox](https://animefox.tv/), and more.<br />

## How it Works
The concept of AniSync is relatively simple. Using a string similarity algorithm ([Dice's Coefficient](https://en.wikipedia.org/wiki/S%C3%B8rensen%E2%80%93Dice_coefficient), courtesy of the NPM package [string-similarity](https://www.npmjs.com/package/string-similarity)), AniSync first sends a request to AniList and then to all providers. Then, a comparison will be started between the title of the AniList result and the provider's result. AniSync will then try and find the best result and return it. This process is ran twice: once for sending a request to AniList and once for sending a request to the providers. This is done to ensure that the best result is returned.

## Installation
I recently pushed a really large update of AniSync and didn't get a chance to finish writing it. If you need support, please join my [Discord](https://discord.gg/F87wYBtnkC).

## Providers
<table>
    <tr>
        <th>Name</th>
        <th>Link</th>
        <th>Notes</th>
    </tr>
    <tr>
        <td>9anime</td>
        <td><a href="https://9anime.pl/">Link</a></td>
        <td>For self-hosting, this requires a special [resolver and 9anime key](https://discord.gg/DSRPwj3Ams). Resolver code not available to the public.</td>
    </tr>
    <tr>
        <td>AllAnime</td>
        <td><a href="https://allanime.to/">Link</a></td>
        <td>N/A</td>
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
        <td>Site that maps GogoAnime and Zoro to AniList for a high database of shows.</td>
    </tr>
    <tr>
    <td>Marin</td>
        <td><a href="https://marin.moe/">Link</a></td>
        <td>Extremely high rate limit.</td>
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
        <td>MangaReader</td>
        <td><a href="https://mangareader.one/">Link</a></td>
        <td>MangaReader.to clone that has some raw manga.</td>
    </tr>
    <tr>
        <td>MangaPark</td>
        <td><a href="https://v2.mangapark.net/">Link</a></td>
        <td>N/A</td>
    </tr>
    <tr>
        <td>MangaSee</td>
        <td><a href="https://mangasee123.com/">Link</a></td>
        <td>N/A</td>
    </tr>
    <tr>
        <td>AnimeK</td>
        <td><a href="https://animek.fun/">Link</a></td>
        <td>Fetches special information on airing shows.</td>
    </tr>
    <tr>
        <td>AnimeThemes</td>
        <td><a href="https://animethemes.moe/">Link</a></td>
        <td>Anime meta provider for fetching anime OP's/ED's.</td>
    </tr>
    <tr>
        <td>Chiaki</td>
        <td><a href="https://chiaki.site/">Link</a></td>
        <td>Used for knowing the watch order of shows.</td>
    </tr>
    <tr>
        <td>TMDB</td>
        <td><a href="https://themoviedb.org/">Link</a></td>
        <td>Gets special artwork that AniList doesn't have.</td>
    </tr>
    <tr>
        <td>Kitsu</td>
        <td><a href="https://kitsu.io/">Link</a></td>
        <td>Meta provider for additional information AniList might not have.</td>
    </tr>
    <tr>
        <td>JNovels</td>
        <td><a href="https://jnovels.com/">Link</a></td>
        <td>Fetches download links for light novels.</td>
    </tr>
    <tr>
        <td>NovelUpdates</td>
        <td><a href="https://novelupdates.com/">Link</a></td>
        <td>Requires Python3 to use a CloudFlare bypass package.</td>
    </tr>
    <tr>
        <td>MyAnimeList*</td>
        <td><a href="https://myanimelist.com/">Link</a></td>
        <td>N/A</td>
    </tr>
</table>
*Not finished yet.