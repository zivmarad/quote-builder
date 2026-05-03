/** מפתח X-Admin-Key חייב להיות Latin-1 ב-fetch; מפתחות ישנים עם עברית נדחים ויש להתחבר מחדש */
export function isAdminWireKeyHeaderSafe(key: string): boolean {
  for (let i = 0; i < key.length; i++) {
    if (key.charCodeAt(i) > 255) return false;
  }
  return true;
}
