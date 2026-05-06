/**
 * Tiny fetch wrapper for our admin write API.
 *
 * Why not pull a heavyweight client (axios/ky):
 *  - Standard fetch + Next.js Edge-friendly is enough.
 *  - We only have ~10 routes; a dependency would add weight, not safety.
 *  - SWR handles caching/dedup; this layer just standardizes error shape.
 */

export class ApiClientError extends Error {
  constructor(public status: number, message: string, public payload?: unknown) {
    super(message);
    this.name = "ApiClientError";
  }
}

async function parseJsonSafe(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  json?: unknown;
}

export async function apiFetch<T = unknown>(
  url: string,
  opts: RequestOptions = {},
): Promise<T> {
  const init: RequestInit = {
    ...opts,
    headers: {
      ...(opts.json !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(opts.headers ?? {}),
    },
  };
  if (opts.json !== undefined) {
    init.body = JSON.stringify(opts.json);
  }

  const res = await fetch(url, init);
  const payload = await parseJsonSafe(res);

  if (!res.ok) {
    const message =
      payload && typeof payload === "object" && payload !== null && "error" in payload
        ? String((payload as { error: unknown }).error)
        : `HTTP ${res.status}`;
    throw new ApiClientError(res.status, message, payload);
  }

  return payload as T;
}

/** SWR-shaped fetcher — bare URL → typed JSON. SWR's typing wants the
 *  generic to thread back through Promise<T>, so we use a generic helper. */
export function swrFetcher<T = unknown>(url: string): Promise<T> {
  return apiFetch<T>(url);
}
