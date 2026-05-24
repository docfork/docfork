// unit: Page<T> iteration + .next() + .toArray(). no network.

import { describe, it, expect } from "vitest";
import { Page, type PageData } from "./pagination";

interface Item {
  id: number;
}

function makePages(pages: Item[][]): Page<Item> {
  const build = (idx: number): Page<Item> => {
    const data = pages[idx]!;
    const has_more = idx < pages.length - 1;
    const next_cursor = has_more ? `cursor_${idx + 1}` : null;
    const initial: PageData<Item> = {
      data,
      next_cursor,
      has_more,
      request_id: `req_${idx}`,
    };
    return new Page(initial, async () => build(idx + 1));
  };
  return build(0);
}

describe("Page", () => {
  it("exposes data, next_cursor, has_more, request_id from initial", () => {
    const p = makePages([[{ id: 1 }, { id: 2 }]]);
    expect(p.data).toEqual([{ id: 1 }, { id: 2 }]);
    expect(p.has_more).toBe(false);
    expect(p.next_cursor).toBeNull();
    expect(p.request_id).toBe("req_0");
  });

  it(".next() returns null on last page", async () => {
    const p = makePages([[{ id: 1 }]]);
    expect(await p.next()).toBeNull();
  });

  it(".next() advances when has_more", async () => {
    const p = makePages([[{ id: 1 }], [{ id: 2 }]]);
    const next = await p.next();
    expect(next?.data).toEqual([{ id: 2 }]);
    expect(next?.request_id).toBe("req_1");
  });

  it("async iterator yields items across pages", async () => {
    const p = makePages([
      [{ id: 1 }, { id: 2 }],
      [{ id: 3 }],
      [{ id: 4 }, { id: 5 }],
    ]);
    const ids: number[] = [];
    for await (const item of p) ids.push(item.id);
    expect(ids).toEqual([1, 2, 3, 4, 5]);
  });

  it(".toArray() collects all items across pages", async () => {
    const p = makePages([[{ id: 1 }], [{ id: 2 }], [{ id: 3 }]]);
    const all = await p.toArray();
    expect(all.map((i) => i.id)).toEqual([1, 2, 3]);
  });

  it(".toArray({ limit }) caps total items", async () => {
    const p = makePages([
      [{ id: 1 }, { id: 2 }],
      [{ id: 3 }, { id: 4 }],
    ]);
    const all = await p.toArray({ limit: 3 });
    expect(all.map((i) => i.id)).toEqual([1, 2, 3]);
  });

  it(".toArray({ limit }) does not over-fetch past cap", async () => {
    let fetchCount = 0;
    const initial: PageData<Item> = {
      data: [{ id: 1 }, { id: 2 }],
      next_cursor: "next",
      has_more: true,
      request_id: "req_0",
    };
    const p: Page<Item> = new Page(initial, async () => {
      fetchCount++;
      return new Page(
        {
          data: [{ id: 3 }],
          next_cursor: null,
          has_more: false,
          request_id: "req_1",
        },
        async () => {
          throw new Error("should not be called");
        },
      );
    });
    const all = await p.toArray({ limit: 2 });
    expect(all.length).toBe(2);
    expect(fetchCount).toBe(0); // limit hit before any fetch
  });
});
