const KEY = "eventify_device_id";

export function getDeviceId(): string {
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    // If localStorage is unavailable, return a session-only ID
    return crypto.randomUUID();
  }
}