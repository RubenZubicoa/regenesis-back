/** Indica si el usuario quiere publicar el logro en la comunidad. */
export function parseShareInCommunity(body: Record<string, unknown>): boolean {
  const value = body.shareInCommunity;
  return value === true || value === "true" || value === 1 || value === "1";
}
