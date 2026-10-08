/** Backend base URL, reachable from this server (same value as the /api rewrites). Server only. */
export const apiInternalUrl = () => process.env.API_INTERNAL_URL ?? "http://localhost:4000";
