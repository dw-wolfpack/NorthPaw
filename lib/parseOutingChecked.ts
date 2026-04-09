/** Parse stored JSON array of checklist item ids; invalid input yields []. */
export function parseOutingCheckedIds(json: string): string[] {
  try {
    const a = JSON.parse(json) as unknown;
    if (!Array.isArray(a)) return [];
    return a.filter((x): x is string => typeof x === 'string');
  } catch {
    return [];
  }
}
