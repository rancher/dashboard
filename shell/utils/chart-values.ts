import jsyaml from 'js-yaml';
import merge from 'lodash/merge';
import isPlainObject from 'lodash/isPlainObject';
import { diff, mergeWithReplace } from '@shell/utils/object';
import { saferDump } from '@shell/utils/create-yaml';

/**
 * Helpers for the "editable overrides + read-only final values" YAML editing UX
 * (see YamlOverridesEditor.vue). The editable pane holds only the user's
 * overrides - the values that differ from a set of defaults (e.g. a chart's
 * default values) - mirroring `helm install --values`. Keeping the editor to
 * overrides only is what stops removed keys from being sent as `null`.
 */

/**
 * Derive the overrides-only YAML (the diff of `values` against `defaults`) that
 * seeds the editable pane. Returns an empty string when there are no overrides.
 */
export function overridesFromValues(defaults: object, values: object): string {
  const overrides = diff(defaults || {}, values || {});

  return Object.keys(overrides).length ? saferDump(overrides) : '';
}

/**
 * Merge the edited overrides YAML onto the defaults to produce the "final
 * values" document - what the values actually resolve to. Invalid (mid-edit)
 * overrides YAML falls back to the defaults rather than throwing.
 */
export function mergeOverrides(defaults: object, overridesYaml: string): string {
  let overrides: unknown = {};

  try {
    overrides = jsyaml.load(overridesYaml || '');
  } catch (e) {
    overrides = {};
  }

  // Helm values must be a mapping. A bare scalar/array/string (e.g. mid-edit
  // "foo") would otherwise be merged into the defaults character-by-character,
  // so ignore anything that isn't a plain object.
  if (!isPlainObject(overrides)) {
    overrides = {};
  }

  const combined = mergeWithReplace(merge({}, defaults || {}), overrides);

  return saferDump(combined);
}

/**
 * Whether the overrides YAML merges cleanly onto the defaults: true when empty or
 * a mapping, false when it fails to parse or is a bare scalar/array (which
 * `mergeOverrides` silently drops). Lets callers detect a mid-edit document a
 * merged view wouldn't faithfully represent.
 */
export function overridesAreMergeable(overridesYaml: string): boolean {
  let parsed: unknown;

  try {
    parsed = jsyaml.load(overridesYaml || '');
  } catch (e) {
    return false;
  }

  // Empty overrides are fine; otherwise it must be a mapping to merge cleanly.
  return parsed === undefined || parsed === null || isPlainObject(parsed);
}

/**
 * Single-parse combination of `overridesAreMergeable` + `mergeOverrides`: returns
 * the merged "final values" document when the overrides merge cleanly, or null for
 * mid-edit/invalid overrides (a parse error or a bare scalar/array) that a merge
 * would silently drop. Lets a caller get both answers from one parse.
 */
export function mergeOverridesIfMergeable(defaults: object, overridesYaml: string): string | null {
  let overrides: unknown;

  try {
    overrides = jsyaml.load(overridesYaml || '');
  } catch (e) {
    return null;
  }

  if (overrides === undefined || overrides === null) {
    overrides = {};
  } else if (!isPlainObject(overrides)) {
    // A bare scalar/array isn't a Helm values mapping - not mergeable.
    return null;
  }

  const combined = mergeWithReplace(merge({}, defaults || {}), overrides);

  return saferDump(combined);
}

/**
 * Like `mergeOverrides`, but when the overrides don't parse it keeps the raw lines
 * instead of collapsing to the defaults: the longest valid leading part is merged
 * (keeping untouched siblings for context) and the rest is appended verbatim, so a
 * mid-edit diff still shows the whole document. It can't place a stray line exactly
 * where it sat, but it shows all of them.
 */
export function mergeOverridesRawText(defaults: object, overridesYaml: string): string {
  const text = overridesYaml || '';

  if (overridesAreMergeable(text)) {
    return mergeOverrides(defaults, text);
  }

  // Find the longest run of leading lines that still parses to a mapping.
  const lines = text.split('\n');
  let validCount = 0;

  for (let i = lines.length - 1; i >= 1; i--) {
    if (overridesAreMergeable(lines.slice(0, i).join('\n'))) {
      validCount = i;
      break;
    }
  }

  // Merge the valid part (keeps untouched sibling fields as context) ...
  const merged = mergeOverrides(defaults, lines.slice(0, validCount).join('\n'));
  // ... and append whatever the user typed after it, verbatim.
  const remainder = lines.slice(validCount).join('\n').replace(/\n+$/, '');

  if (!remainder.trim()) {
    return merged;
  }

  // `merged` already ends with a trailing newline from the YAML serializer.
  return `${ merged }${ remainder }\n`;
}

/**
 * Compare two override YAML strings by their parsed content rather than raw
 * text. Typing then deleting in the editor can leave residual whitespace (e.g.
 * a trailing newline) that makes the strings differ even though there are no
 * real changes. Empty/whitespace-only or unparseable input is treated as an
 * empty document.
 */
export function sameYamlOverrides(a: string, b: string): boolean {
  const parse = (yaml: string) => {
    try {
      return JSON.stringify(jsyaml.load(yaml || '') || {});
    } catch (e) {
      return yaml;
    }
  };

  return parse(a) === parse(b);
}
