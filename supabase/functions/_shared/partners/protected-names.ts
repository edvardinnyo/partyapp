// D-008/5: nobody else may take a verified partner's name, or one very close to it.

/** How close a name may come to a verified partner's name. */
export const PROTECTED_NAME_RULES = {
  /** A name containing a protected name of at least this length is taken ("fogashaz.official"). */
  containsMinLength: 5,
  /** One typo away from a protected name of at least this length is taken ("fogashazz"). */
  oneEditMinLength: 6,
} as const;

export type ProtectedName = { userId: string; username: string; displayName: string };

/** Letters and digits only, lowercase, without accents: "Fogasház Bp." → "fogashazbp". */
export function nameKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/** True when the two words differ in at most one inserted, removed or changed letter. */
function withinOneEdit(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) {
    return false;
  }
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i += 1;
      j += 1;
      continue;
    }
    edits += 1;
    if (edits > 1) {
      return false;
    }
    if (a.length > b.length) {
      i += 1;
    } else if (a.length < b.length) {
      j += 1;
    } else {
      i += 1;
      j += 1;
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

export function isTooSimilar(candidate: string, protectedName: string): boolean {
  const name = nameKey(candidate);
  const taken = nameKey(protectedName);
  if (name === '' || taken === '') {
    return false;
  }
  return (
    name === taken ||
    (taken.length >= PROTECTED_NAME_RULES.containsMinLength && name.includes(taken)) ||
    (taken.length >= PROTECTED_NAME_RULES.oneEditMinLength && withinOneEdit(name, taken))
  );
}

/** Whether any of the names (e.g. a username and a display name) clashes with a partner's. */
export function clashesWithProtectedNames(
  names: readonly string[],
  protectedNames: readonly ProtectedName[],
  ownUserId?: string,
): boolean {
  return protectedNames.some(
    (partner) =>
      partner.userId !== ownUserId &&
      names.some(
        (name) => isTooSimilar(name, partner.username) || isTooSimilar(name, partner.displayName),
      ),
  );
}
