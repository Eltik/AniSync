"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slugify = exports.setIntervalImmediately = exports.stringSearch = exports.similarity = exports.sanitizeTitle = exports.substringAfter = exports.substringBefore = exports.isJson = exports.wait = exports.USER_AGENT = void 0;
const stringSimilarity_1 = require("./stringSimilarity");
exports.USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36";
function wait(time) {
    return new Promise(resolve => {
        setTimeout(resolve, time);
    });
}
exports.wait = wait;
function isJson(str) {
    try {
        JSON.parse(str);
    }
    catch (e) {
        return false;
    }
    return true;
}
exports.isJson = isJson;
function substringBefore(str, toFind) {
    const index = str.indexOf(toFind);
    return index == -1 ? '' : str.substring(0, index);
}
exports.substringBefore = substringBefore;
;
function substringAfter(str, toFind) {
    const index = str.indexOf(toFind);
    return index == -1 ? '' : str.substring(index + toFind.length);
}
exports.substringAfter = substringAfter;
;
function sanitizeTitle(title) {
    let resTitle = title.replace(/ *(\(dub\)|\(sub\)|\(uncensored\)|\(uncut\)|\(subbed\)|\(dubbed\))/i, '');
    resTitle = resTitle.replace(/ *\([^)]+audio\)/i, '');
    resTitle = resTitle.replace(/ BD( |$)/i, '');
    resTitle = resTitle.replace(/\(TV\)/g, '');
    resTitle = resTitle.trim();
    resTitle = resTitle.substring(0, 99); // truncate
    return resTitle;
}
exports.sanitizeTitle = sanitizeTitle;
function similarity(externalTitle, title, titleArray = []) {
    if (!title) {
        title = "";
    }
    let simi = (0, stringSimilarity_1.compareTwoStrings)(sanitizeTitle(title.toLowerCase()), externalTitle.toLowerCase());
    titleArray.forEach(el => {
        if (el) {
            const tempSimi = (0, stringSimilarity_1.compareTwoStrings)(title.toLowerCase(), el.toLowerCase());
            if (tempSimi > simi)
                simi = tempSimi;
        }
    });
    let found = false;
    if (simi > 0.6) {
        found = true;
    }
    return {
        same: found,
        value: simi,
    };
}
exports.similarity = similarity;
function stringSearch(string, pattern) {
    let count = 0;
    string = string.toLowerCase();
    pattern = pattern.toLowerCase();
    string = string.replace(/[^a-zA-Z0-9 -]/g, "");
    pattern = pattern.replace(/[^a-zA-Z0-9 -]/g, "");
    for (let i = 0; i < string.length; i++) {
        for (let j = 0; j < pattern.length; j++) {
            if (pattern[j] !== string[i + j])
                break;
            if (j === pattern.length - 1)
                count++;
        }
    }
    return count;
}
exports.stringSearch = stringSearch;
function setIntervalImmediately(func, interval) {
    func();
    return setInterval(async () => {
        try {
            await func();
        }
        catch (e) {
            console.error("Error occurred while trying to execute the interval function: ", e);
        }
    }, interval);
}
exports.setIntervalImmediately = setIntervalImmediately;
const slugify = (...args) => {
    const replaceLoweringCase = (string, [regExp, replacement]) => string.replace(RegExp(regExp, "giu"), replacement);
    let value = args.join(" ");
    defaultReplacements.forEach(([a, b]) => {
        value = replaceLoweringCase(value, [a, b]);
    });
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "-")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9 ]/g, "-")
        .replace(/\s+/g, "-");
};
exports.slugify = slugify;
const defaultReplacements = [
    ["[aàáâãäåāăąǻάαа]", "a"],
    ["[bбḃ]", "b"],
    ["[cçćĉċčћ]", "c"],
    ["[dðďđδдђḋ]", "d"],
    ["[eèéêëēĕėęěέεеэѐё]", "e"],
    ["[fƒφфḟ]", "f"],
    ["[gĝğġģγгѓґ]", "g"],
    ["[hĥħ]", "h"],
    ["[iìíîïĩīĭįıΐήίηιϊийіїѝ]", "i"],
    ["[jĵј]", "j"],
    ["[kķĸκкќ]", "k"],
    ["[lĺļľŀłλл]", "l"],
    ["[mμмṁ]", "m"],
    ["[nñńņňŉŋνн]", "n"],
    ["[oòóôõöōŏőοωόώо]", "o"],
    ["[pπпṗ]", "p"],
    ["q", "q"],
    ["[rŕŗřρр]", "r"],
    ["[sśŝşšſșςσсṡ]", "s"],
    ["[tţťŧțτтṫ]", "t"],
    ["[uùúûüũūŭůűųуў]", "u"],
    ["[vβв]", "v"],
    ["[wŵẁẃẅ]", "w"],
    ["[xξ]", "x"],
    ["[yýÿŷΰυϋύыỳ]", "y"],
    ["[zźżžζз]", "z"],
    ["[æǽ]", "ae"],
    ["[χч]", "ch"],
    ["[ѕџ]", "dz"],
    ["ﬁ", "fi"],
    ["ﬂ", "fl"],
    ["я", "ia"],
    ["[ъє]", "ie"],
    ["ĳ", "ij"],
    ["ю", "iu"],
    ["х", "kh"],
    ["љ", "lj"],
    ["њ", "nj"],
    ["[øœǿ]", "oe"],
    ["ψ", "ps"],
    ["ш", "sh"],
    ["щ", "shch"],
    ["ß", "ss"],
    ["[þθ]", "th"],
    ["ц", "ts"],
    ["ж", "zh"],
    // White_Space, General_Category=Dash_Punctuation and Control Codes
    [
        "[\\u0009-\\u000D\\u001C-\\u001F\\u0020\\u002D\\u0085\\u00A0\\u1680\\u2000-\\u200A\\u2028\\u2029\\u202F\\u205F\\u3000\\u058A\\u05BE\\u1400\\u1806\\u2010-\\u2015\\u2E17\\u2E1A\\u2E3A\\u2E3B\\u2E40\\u301C\\u3030\\u30A0\\uFE31\\uFE32\\uFE58\\uFE63\\uFF0D]",
        "-",
    ],
];
