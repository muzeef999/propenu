import { Request, Response, NextFunction, RequestHandler } from "express";

export type CursorBuilder<TFilters = any, TDoc = any> =
  (filters: TFilters, batchSize?: number) => Promise<AsyncIterableIterator<TDoc>>;

export type StreamingOptions<TFilters = any> = {
  batchSize?: number;
  maxItems?: number | null;
  initialMeta?: ((filters: TFilters) => any) | null;
  allowedSorts?: Set<string> | null;
  sanitizeFilters?: (req: Request) => TFilters;
  onError?: (err: any, req: Request, res: Response) => void;
};

export default function createStreamingHandler<TFilters = any, TDoc = any>(
  cursorBuilder: CursorBuilder<TFilters, TDoc>,
  options: StreamingOptions<TFilters> = {}
): RequestHandler {
  const {
    batchSize = 100,
    maxItems = null,
    initialMeta = null,
    allowedSorts = null,
    sanitizeFilters = (req: Request): any => req.query as unknown as TFilters,
    onError = (err) => { console.error("streaming handler error:", err); }
  } = options;

  return async function streamingHandler(req: Request, res: Response, next: NextFunction) {
    let filters: TFilters;
    try {
      filters = sanitizeFilters(req);
    } catch (err) {
      res.status(400).json({ error: "Invalid filters" });
      return;
    }

    if (allowedSorts && (filters as any).sort && !allowedSorts.has((filters as any).sort)) {
      res.status(400).json({ error: "Invalid sort param" });
      return;
    }

    res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-store, no-transform");

    if (initialMeta) {
      try {
        const meta = initialMeta(filters);
        res.write(JSON.stringify({ __meta: meta }) + "\n");
      } catch {}
    }

    let cursor: AsyncIterableIterator<TDoc> | null = null;
    try {
      cursor = await cursorBuilder(filters, batchSize);
      if (!cursor || typeof (cursor as any)[Symbol.asyncIterator] !== "function") {
        throw new Error("cursorBuilder did not return an async iterator");
      }
    } catch (err) {
      onError(err, req, res);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to prepare stream" });
      } else {
        try { res.write(JSON.stringify({ __error: true, message: "Failed to prepare stream" }) + "\n"); } catch {}
        try { res.end(); } catch {}
      }
      return;
    }

    let aborted = false;
    req.on("close", () => {
      aborted = true;
      if (cursor && (cursor as any).return) {
        try { (cursor as any).return(); } catch {}
      } else if (cursor && (cursor as any).close) {
        try { (cursor as any).close(); } catch {}
      }
    });

    try {
      let sent = 0;
      for await (const doc of cursor!) {
        if (aborted) break;
        sent++;
        if (maxItems !== null && typeof maxItems === "number" && sent > maxItems) {
          try { res.write(JSON.stringify({ __meta: { truncated: true, sent } }) + "\n"); } catch {}
          break;
        }
        let line: string;
        try { line = JSON.stringify(doc) + "\n"; }
        catch { line = JSON.stringify({ id: (doc as any)?.id ?? null, __error: "serialization_error" }) + "\n"; }

        const ok = res.write(line);
        if (!ok) await new Promise<void>((resolve) => res.once("drain", resolve));
      }
    } catch (err) {
      if (!aborted) {
        onError(err, req, res);
        try {
          if (res.headersSent) {
            res.write(JSON.stringify({ __error: true, message: "internal_stream_error" }) + "\n");
          }
        } catch {}
      }
    } finally {
      if (!aborted) try { res.end(); } catch {}
      if (cursor && (cursor as any).return) try { await (cursor as any).return(); } catch {}
      else if (cursor && (cursor as any).close) try { (cursor as any).close(); } catch {}
    }
  };
}
