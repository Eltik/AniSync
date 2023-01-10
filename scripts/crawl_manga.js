/**
 * @description This is a basic example of crawling through AniList. This script will run through AniList based on the configured options.
 * It will run until it hits the max page specified.
 */
const AniSync = require("../built/AniSync").default;
const a = new AniSync();
a.crawl("MANGA")