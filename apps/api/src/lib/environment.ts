/**
 * Reads an environment variable that the server cannot work without.
 * Fails fast with a clear message instead of propagating an undefined value.
 */
export function getRequiredEnvironmentVariable(
  variableName: string,
  environment: Readonly<Record<string, string | undefined>> = process.env,
): string {
  const value = environment[variableName]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${variableName}`);
  }
  return value;
}
