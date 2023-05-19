import dotenv from "dotenv";
dotenv.config();

jest.setTimeout(120000);

import { ANIME_PROVIDERS } from "@/src/mapping";

const provider = ANIME_PROVIDERS[2];

test("returns a filled array of anime list", async () => {
    const data = await provider.search("Overlord IV");
    expect(data).not.toBeUndefined();
    expect(data).not.toEqual([]);
    expect(data?.[0].id).not.toBeUndefined();
});
