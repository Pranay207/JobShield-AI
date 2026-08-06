const KEY = "jobshield_anonymous_session_id";

export function getAnonymousSessionId() {
  if (typeof window === "undefined") return null;
  let id = window.localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(KEY, id);
  }
  return id;
}
