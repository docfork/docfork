// async-iterator pagination wrapper; carries request_id per page for debuggability across hops.

export interface PageData<T> {
  data: T[];
  next_cursor: string | null;
  has_more: boolean;
  request_id: string;
}

export class Page<T> implements PageData<T> {
  readonly data: T[];
  readonly next_cursor: string | null;
  readonly has_more: boolean;
  readonly request_id: string;
  readonly #fetcher: (cursor: string) => Promise<Page<T>>;

  constructor(
    initial: PageData<T>,
    fetcher: (cursor: string) => Promise<Page<T>>,
  ) {
    this.data = initial.data;
    this.next_cursor = initial.next_cursor;
    this.has_more = initial.has_more;
    this.request_id = initial.request_id;
    this.#fetcher = fetcher;
  }

  /** fetch the next page, or null if this is the last page. */
  async next(): Promise<Page<T> | null> {
    if (!this.has_more || !this.next_cursor) return null;
    return this.#fetcher(this.next_cursor);
  }

  /** collect items across all pages. opts.limit caps total items to prevent runaway. */
  async toArray(opts?: { limit?: number }): Promise<T[]> {
    const cap = opts?.limit ?? Infinity;
    const all: T[] = [...this.data];
    if (all.length >= cap) return all.slice(0, cap); // cap hit on initial page, skip fetch.
    let page = await this.next();
    while (page && all.length < cap) {
      all.push(...page.data);
      page = await page.next();
    }
    return all.slice(0, cap);
  }

  async *[Symbol.asyncIterator](): AsyncIterator<T> {
    for (const item of this.data) yield item;
    let page = await this.next();
    while (page) {
      for (const item of page.data) yield item;
      page = await page.next();
    }
  }
}
