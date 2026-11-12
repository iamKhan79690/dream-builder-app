// Small helper for calling the Dream Builder API.
//
//   const { user } = await api<{ user: User }>("/auth/login", { method: "POST", body: { email, password } });
//
// - Adds the /api/v1 prefix (Vite's dev proxy forwards /api to the backend).
// - Sends and parses JSON.
// - Sends the "sid" session cookie automatically (same origin, so the browser does it).
// - Throws ApiError with the server's message when the response isn't ok.

const BASE = "/api/v1";

export class ApiError extends Error {
  readonly status: number;
  /** Per-field validation errors from the server, e.g. { password: ["Too small..."] }. */
  readonly fields: Record<string, string[]>;

  constructor(message: string, status: number, fields: Record<string, string[]> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fields = fields;
  }
}

type Method = "GET" | "POST" | "PATCH" | "DELETE";

interface ApiOptions {
  method?: Method;
  body?: unknown;
  signal?: AbortSignal;
}

export async function api<T = unknown>(path: string, { method = "GET", body, signal }: ApiOptions = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(BASE + path, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "same-origin",
      signal,
    });
  } catch (err) {
    // Aborted on purpose (e.g. the screen unmounted): let the caller ignore it.
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    // fetch only throws when there's no response at all: offline, server down, etc.
    throw new ApiError("Can't reach the server. Check your connection and try again.", 0);
  }

  // 204 No Content (logout, delete): nothing to parse.
  if (res.status === 204) return undefined as T;

  // Not every response is JSON (e.g. the dev proxy's error page when the backend is off).
  const data: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const payload = (data ?? {}) as { error?: unknown; fields?: unknown };
    const message =
      typeof payload.error === "string"
        ? payload.error
        : res.status >= 500
          ? "Something went wrong on our side. Please try again."
          : `Request failed (${res.status})`;
    const fields = payload.fields && typeof payload.fields === "object" ? (payload.fields as Record<string, string[]>) : {};
    throw new ApiError(message, res.status, fields);
  }

  return data as T;
}
