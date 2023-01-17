"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const gradient = require("gradient-string");
const colors = require("colors");
const inquirer = require("inquirer");
const Anime_1 = require("../providers/anime/Anime");
const Manga_1 = require("../providers/manga/Manga");
const AniSync_1 = require("../AniSync");
const aniSync = new AniSync_1.default();
const anime = new Anime_1.default("", "");
const manga = new Manga_1.default("", "");
const title = `
    ___          _ _____                 
   /   |  ____  (_) ___/__  ______  _____
  / /| | / __ \/ /\__ \/ / / / __ \/ ___/
 / ___ |/ / / / /___/ / /_/ / / / / /__  
/_/  |_/_/ /_/_//____/\__, /_/ /_/\___/  
                     /____/              `;
const altTitle = `
___        _                      
/ _ \      (_)                     
/ /_\ \_ __  _ ___ _   _ _ __   ___ 
|  _  | '_ \| / __| | | | '_ \ / __|
| | | | | | | \__ \ |_| | | | | (__ 
\_| |_/_| |_|_|___/\__, |_| |_|\___|
                  __/ |           
                 |___/            
`;
// colors brought in from vscode poimandres theme
const poimandresTheme = {
    blue: "#add7ff",
    cyan: "#89ddff",
    green: "#5de4c7",
    magenta: "#fae4fc",
    red: "#d0679d",
    yellow: "#fffac2",
};
const titleGradient = gradient(Object.values(poimandresTheme));
console.log(titleGradient.multiline(title));
// Commands
/*
- Searching
- Crawling
- Exporting
- Clearing DB
*/
const cliFlags = {
    search: false,
    query: "",
    crawl: false,
    export: false,
    delete: false,
    type: "",
};
const program = new commander_1.Command().name("AniSync");
program.description("A robust CLI for matching anime to AniList.")
    .option("-s, --search <query> <anime/manga>", "Search for a media by title.")
    .option("-c, --crawl <anime/manga>", "Crawl/create a database of media.")
    .option("-e, --export <anime/manga>", "Export the created database of media.")
    .option("-d, --delete <anime/manga>", "Clear the created database of media.")
    .parse(process.argv);
promptType();
async function promptType() {
    const { type } = await inquirer.prompt({
        type: "list",
        name: "type",
        message: "What media are you using?",
        choices: [
            "Anime",
            "Manga",
        ],
        default: "Anime",
    });
    if (type === "Anime") {
        cliFlags.type = "anime";
    }
    else {
        cliFlags.type = "manga";
    }
    promptUse();
}
async function promptUse() {
    const /*{ search, crawl, export: exportDB, delete: deleteDB }*/ response = await inquirer.prompt({
        type: "list",
        name: "use",
        message: "What would you like to do?",
        choices: [
            {
                name: "Search",
                value: "search",
            },
            {
                name: "Crawl",
                value: "crawl",
            },
            {
                name: "Export",
                value: "export",
            },
            {
                name: "Delete",
                value: "delete",
            },
        ],
        default: "Search",
    });
    if (response.use === "search") {
        cliFlags.search = true;
        await promptSearch();
    }
    else if (response.use === "crawl") {
        cliFlags.crawl = true;
        await runCrawl();
    }
    else if (response.use === "export") {
        cliFlags.export = true;
        await runExport();
    }
    else if (response.use === "delete") {
        cliFlags.delete = true;
        await runDelete();
    }
    else {
        console.log(colors.red("Invalid value inputted.") + colors.gray(" Received ") + colors.white(response.use));
    }
}
async function promptSearch() {
    // Use cliFlags to see what to do
    const { query } = await inquirer.prompt({
        type: "input",
        name: "query",
        message: "What are you searching for?",
        default: "One Piece",
        transformer: (input) => {
            return input.trim();
        },
    });
    cliFlags.query = query;
    await search();
}
async function search() {
    console.log(colors.gray("Searching for " + cliFlags.query + "..."));
    const results = await aniSync.search(cliFlags.query, cliFlags.type === "anime" ? "ANIME" : "MANGA");
    console.log(colors.white("Received " + colors.cyan(String(results.length)) + " results."));
    results.map((result) => {
        console.log(colors.gray(result.anilist.title.english || result.anilist.title.romaji || result.anilist.title.native) + " (" + colors.cyan(String(result.id)) + ")");
    });
}
async function runCrawl() {
    await aniSync.crawl(cliFlags.type === "anime" ? "ANIME" : "MANGA");
}
async function runExport() {
    console.log(colors.gray("Exporting " + cliFlags.type + "..."));
    let result = null;
    if (cliFlags.type === "anime") {
        result = await anime.export();
    }
    else {
        result = await manga.export();
    }
    console.log(colors.white(String(result)));
    console.log(colors.cyan("Finished exporting " + cliFlags.type + "."));
}
async function runDelete() {
    let result = null;
    if (cliFlags.type === "anime") {
        result = await anime.clear();
    }
    else {
        result = await manga.clear();
    }
    console.log(colors.cyan("Finished clearing the database."));
}
//# sourceMappingURL=cli.js.map