export function readDraft(key: string): string {
  try {
    return localStorage.getItem("recall:draft:" + key) ?? "";
  } catch {
    return "";
  }
}
export function storeDraft(key: string, value: string): boolean {
  try {
    if (value) localStorage.setItem("recall:draft:" + key, value);
    else localStorage.removeItem("recall:draft:" + key);
    return true;
  } catch {
    return false;
  }
}
