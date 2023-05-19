import dotenv from "dotenv";
dotenv.config();

jest.setTimeout(120000);

import { MANGA_PROVIDERS } from "@/src/mapping";

const provider = MANGA_PROVIDERS[2];

test("returns a filled array of manga", async () => {
    const data = await provider.search("Solo Leveling");
    expect(data).not.toBeUndefined();
    expect(data).not.toEqual([]);
    expect(data?.[0].id).not.toBeUndefined();
});
