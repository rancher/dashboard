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
