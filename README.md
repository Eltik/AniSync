# AniSync
Mapping sites to AniList and back.
Inspired by [MalSync](https://malsync.moe), this project is made for taking data from popular tracking sites such as [AniList](https://anilist.co) and matching them with sites such as [Zoro.To](https://zoro.to), [MangaDex](https://mangadex.org), and more.

## How it Works
<b>Note</b>: The mapping system is unfortunately not as optimized as it can be, so contribution would very much be appreciated. The mappings code is located at `/src/lib/mappings.ts`.
The concept of AniSync is relatively simple. Upon querying an ID or search request that doesn't exist in the database, AniSync will then map provider IDs to an AniList ID by first sending a search request through each provider. Then, taking each result title (ex. `Mushoku Tensei: Jobless Reincarnation`), send a search request to AniList and then match based on the similarity of the current title and the AniList search title. If you are confused on the details, take a look at the `mappings.ts` file in `/src/lib`.

## Installation
To start, AniSync requires at least [NodeJS v16](http://nodejs.org) installed (untested). Along with that, the following are required for AniSync to run properly:
- [PostgreSQL](https://www.postgresql.org)
- [Python3](https://www.python.org) (for NovelUpdates)
------
You may also install [Redis](https://redis.io) if you want caching enabled. **Note**: The web server doesn't work without Redis as of the current commit. A fix will be added soon.

### Cloning the Repository
To start mapping, I recommend cloning the repository or downloading the code.
```bash
git clone https://github.com/Eltik/AniSync
```

### PostgreSQL
AniSync requires <b>PostgreSQL v15</b> to work as additional extensions are needed for searching the database.
#### Linux/Ubuntu Installation
Run the following commands in the terminal to install PostgreSQL 15.
```bash
# File repo config
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'

# Import repository signing key thingamajig
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# Update package lists
sudo apt-get update

# Install
sudo apt-get -y install postgresql-15
```
```bash
# Requires pg_trgm
sudo apt-get install postgresql-contrib

# Starts the service
sudo systemctl start postgresql.service
```
#### Windows Installation
1. Navigate to the [PostgreSQL website](https://www.postgresql.org).
2. Find the downloads page and click on `Windows`.
3. Download and run the installer.
#### MacOS Installation
It's recommended you use [Homebrew](https://brew.sh) for installing PostgreSQL. Information on the formulae is located [here](https://formulae.brew.sh/formula/postgresql@15). Simply run `brew install postgresql@15` to install PostgreSQL.

#### After installing PostgreSQL...
After you install PostgreSQL on your OS, everything after is pretty simple. You may need to modify the steps above based on what's necessary (for example, I don't have a Windows PC anymore so I might be missing something). The important things to note is that you will likely need `postgresql-contrib` to use extensions. If you get errors from running the commands below, I suggest searching on Google for how to install PostgreSQL extensions.
1. Enter the `postgres` shell. This can be done by opening up your OS's terminal (on Windows `Command Prompt`, on MacOS `Terminal`, etc.) and running just `psql` or `sudo -i -u postgres` and then `psql`.
2. If necessary, run `ALTER USER postgres WITH PASSWORD 'password';`. You will need to input the password or PostgreSQL database URL into the `.env` file later.
3. Run `CREATE EXTENSION IF NOT EXISTS "pg_trgm";` to add the `pg_trgm` extension.
4. Run:
```bash
create or replace function most_similar(text, text[]) returns double precision
language sql as $$
    select max(similarity($1,x)) from unnest($2) f(x)
$$;
```
To add the `most_similar` function.
5. Finally, edit the `.env` file and add the database URL. Take a look at the `.env.example` file for more information. The variable looks something like this:
```
DATABASE_URL="postgresql://postgres:password@localhost:5432"
```
That's it! Feel free to join my [Discord](https://discord.gg/F87wYBtnkC) and ask for help in the `#coding` channel if you need additional support.

### Python
Python3 is needed for scraping [NovelUpdates](https://novelupdates.com) mainly. If you don't want to go through the annoying task of installing Python, you may remove the NovelUpdates class from `/src/mapping/index.ts`. Anyways, installing Python is somewhat self-explanatory, but relatively annoying. I suggest using Python3.
#### Linux/Ubuntu
Run the following command:
```bash
sudo apt install python3-pip
```
#### Windows
1. Navigate to the [Python website](https://python.org).
2. Click [Downloads](https://www.python.org/downloads/).
3. Click the `Download Python 3.x.x` button.
4. Run the installer.
#### MacOS
Nothing needs to be done for most MacOS enviornments as Python3 is natively supported.

#### After installing Python...
Nothing much else needs to be done after installing Python. Just run `pip3 install cloudscraper` or `pip install cloudscraper` then edit the `.env` file. Add `USE_PYTHON3="true"` based on whether you are using Python3 or not. If you are using `pip3` to install cloudscraper, set `USE_PYTHON3` to true. Otherwise, set it to `false`.

## Using AniSync
The following are some additional things you can do to help with using AniSync.
### Crawling
<b>Note</b>:As of the current commit, crawling requires editing the `/src/crawl.ts` file. Change the variables under the `CONFIGURE THINGS HERE` comment. I'll update with a fix soon.
<br />
To start crawling, run `npm run crawl`. Once you have run the command, keep the terminal open and wait. The program will insert media using AniList's [sitemap](https://anilist.co/sitemap/anime-0.xml). **Please note that crawling takes a REALLY long time.** I've mentioned above, but there are more optimizations that can be done to improve the crawling speed. AniList rate limit is a big factor, and as of now, crawling all of AniList will take over 50 days for manga/light novels. I've added the ability to use Manami (an offline database) for anime, so mappings don't take very long using that. The only issue right now is manga/light novels since there doesn't seem to be a good AniList offline database. However, the mappings are very accurate and in the end it's worth it.
### Importing/Exporting
There might be a `database.json` file located in the project. If it isn't, copy it into the root of the project. I have added a `npm run import` command to import pre-made databases so that crawling again isn't necessary. If you want to export the database, run `npm run export`.
### Coding with AniSync
TBD. If you have anything you want to add to this section, please create a pull request!

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
        <td>For self-hosting, this requires a special <a href="https://discord.gg/DSRPwj3Ams">resolver and 9anime key</a>. Resolver code not available to the public.</td>
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
        <td>AnimePahe</td>
        <td><a href="https://animepahe.com/">Link</a></td>
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
        <td>BatoTo</td>
        <td><a href="https://bato.to/">Link</a></td>
        <td>N/A</td>
    </tr>
    <tr>
        <td>MangaSee</td>
        <td><a href="https://mangasee123.com/">Link</a></td>
        <td>N/A</td>
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
        <td>NovelUpdates</td>
        <td><a href="https://novelupdates.com/">Link</a></td>
        <td>Requires Python3 to use a CloudFlare bypass package.</td>
    </tr>
    <tr>
        <td>NovelBuddy</td>
        <td><a href="https://novelbuddy.com/">Link</a></td>
        <td>N/A</td>
    </tr>
    <tr>
        <td>MyAnimeList</td>
        <td><a href="https://myanimelist.com/">Link</a></td>
        <td>N/A</td>
    </tr>
</table>