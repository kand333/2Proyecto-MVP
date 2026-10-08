/**
 * Escapes the characters that are special in a SQL LIKE/ILIKE pattern (`%`, `_` and the escape
 * character `\`) so user input is matched literally. PostgreSQL uses `\` as the default escape.
 */
export function escapeLikePattern(text: string): string {
  return text.replace(/[\\%_]/g, (character) => `\\${character}`);
}
