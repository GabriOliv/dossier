/** Joins the truthy class names with spaces, as Dossier's `cls`. */
export function cls(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}
