/**
 * Alias resolution engine for the three-layer token model.
 * Handles {alias.path} syntax with circular reference detection.
 */

const ALIAS_REGEX = /^\{([^}]+)\}$/;

/** Check if a value string is an alias reference */
export function isAlias(value) {
  if (typeof value !== 'string') return false;
  return ALIAS_REGEX.test(value);
}

/** Extract the alias path from a value like "{color.primary.500}" */
export function getAliasPath(value) {
  const match = value?.match(ALIAS_REGEX);
  return match ? match[1] : null;
}

/** Build a flat token lookup map from an array of token sets */
export function buildTokenMap(tokenSets, activeSetIds) {
  const map = new Map();
  for (const setId of activeSetIds) {
    const set = tokenSets.find(s => s.id === setId);
    if (!set?.tokens) continue;
    for (const token of set.tokens) {
      map.set(token.name, token);
    }
  }
  return map;
}

/**
 * Resolve a token's final value, following aliases.
 * Returns { value, chain, error } where chain is the resolution path.
 */
export function resolveToken(tokenName, tokenMap, visited = new Set()) {
  const token = tokenMap.get(tokenName);
  if (!token) return { value: null, chain: [], error: `Token "${tokenName}" not found` };

  const rawValue = typeof token.value === 'object' && token.value !== null
    ? token.value.value ?? token.value
    : token.value;

  const chain = [{ name: tokenName, token }];

  if (!isAlias(rawValue)) {
    return { value: rawValue, chain, error: null };
  }

  const aliasPath = getAliasPath(rawValue);
  if (visited.has(tokenName)) {
    return { value: rawValue, chain, error: `Circular reference detected: ${tokenName} → ${aliasPath}` };
  }

  const next = resolveToken(aliasPath, tokenMap, new Set([...visited, tokenName]));
  return {
    value: next.value,
    chain: [...chain, ...next.chain],
    error: next.error
  };
}

/**
 * Validate all tokens in a map for circular references.
 * Returns a map of tokenName → error message (only for tokens with issues).
 */
export function validateAliases(tokenMap) {
  const errors = new Map();
  for (const [name] of tokenMap) {
    const { error } = resolveToken(name, tokenMap);
    if (error) errors.set(name, error);
  }
  return errors;
}

/** Get all tokens that reference a given token (direct or indirect dependents) */
export function getDependents(targetName, tokenMap) {
  const dependents = [];
  for (const [name, token] of tokenMap) {
    const raw = token.value?.value ?? token.value;
    if (isAlias(raw) && getAliasPath(raw) === targetName) {
      dependents.push(name);
    }
  }
  return dependents;
}
