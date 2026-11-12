// 8-4-4-4-12 hex characters, e.g. "e37e8238-ad2c-416e-ad08-a1a68ab5a4d5".
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Check URL params like /children/:id BEFORE querying. If we passed "abc" to a
// uuid column, Postgres would throw an error and the user would get a 500.
// With this check, a bad id is simply "not found" (404).
export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}
