import dotenv from "dotenv";
dotenv.config();

jest.setTimeout(120000);

import { loadMapping } from "@/src/lib/mappings";
import { Type } from "@/src/mapping";

test("maps hyouka", async () => {
    const data = await loadMapping({ id: "12189", type: Type.ANIME });
    expect(data).not.toContain([]);
});
