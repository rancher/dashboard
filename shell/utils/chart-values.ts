import jsyaml from 'js-yaml';
import merge from 'lodash/merge';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import isObject from 'lodash/isObject';
import isPlainObject from 'lodash/isPlainObject';
import { diff, mergeWithReplace } from '@shell/utils/object';
import { saferDump } from '@shell/utils/create-yaml';

/**
 * Helpers for the chart values editor (YamlOverridesEditor.vue). Only the values that
 * differ from the chart defaults are saved, like `helm install --values`, so a removed
 * key isn't sent as `null`.
 */

export function overridesFromValues(defaults: object, values: object): string {
  const overrides = diff(defaults || {}, values || {});

  return Object.keys(overrides).length ? saferDump(overrides) : '';
}

/**
 * A key missing from `values` keeps its default, like in a Helm values file, instead of
 * becoming `null`. Only an explicit `key: null` removes a default.
 */
export function overridesFromEditedValues(defaults: object, values: object): string {
  return overridesFromValues(defaults, mergeOverridesValues(defaults, values));
}

// Overrides that aren't a mapping are ignored, or a string like "foo" typed mid-edit
// would be merged in character by character
export function mergeOverridesValues(defaults: object, overrides: unknown): object {
  return mergeWithReplace(merge({}, defaults || {}), isPlainObject(overrides) ? overrides : {});
}

export function mergeOverrides(defaults: object, overridesYaml: string): string {
  let overrides: unknown = {};

  try {
    overrides = jsyaml.load(overridesYaml || '');
  } catch (e) {
    overrides = {};
  }

  return saferDump(mergeOverridesValues(defaults, overrides));
}

export function overridesAreMergeable(overridesYaml: string): boolean {
  let parsed: unknown;

  try {
    parsed = jsyaml.load(overridesYaml || '');
  } catch (e) {
    return false;
  }

  return parsed === undefined || parsed === null || isPlainObject(parsed);
}

/**
 * Like `mergeOverrides`, but overrides that don't parse aren't lost: the longest valid
 * part at the start is merged and the rest is added at the end as it is.
 */
export function mergeOverridesRawText(defaults: object, overridesYaml: string): string {
  const text = overridesYaml || '';

  if (overridesAreMergeable(text)) {
    return mergeOverrides(defaults, text);
  }

  const lines = text.split('\n');
  let validCount = 0;

  for (let i = lines.length - 1; i >= 1; i--) {
    if (overridesAreMergeable(lines.slice(0, i).join('\n'))) {
      validCount = i;
      break;
    }
  }

  const merged = mergeOverrides(defaults, lines.slice(0, validCount).join('\n'));
  const remainder = lines.slice(validCount).join('\n').replace(/\n+$/, '');

  if (!remainder.trim()) {
    return merged;
  }

  return `${ merged }${ remainder }\n`;
}

interface LinePath {
  path: string[];
  isLeaf: boolean;
}

/**
 * The key path of each line, or null for blank lines, comments and array items. It's
 * only meant for the documents `saferDump` writes, not any YAML.
 */
function lineKeyPaths(yaml: string): (LinePath | null)[] {
  const stack: { indent: number, key: string }[] = [];

  return (yaml || '').split('\n').map((raw) => {
    const trimmed = raw.trim();

    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('- ') || trimmed === '-') {
      return null;
    }

    const match = trimmed.match(/^(?:"([^"]+)"|'([^']+)'|([^:]+)):(?:\s+(.*))?$/);

    if (!match) {
      return null;
    }

    const key = match[1] ?? match[2] ?? match[3];
    const inlineValue = match[4];
    const indent = raw.length - raw.trimStart().length;

    while (stack.length && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }
    stack.push({ indent, key });

    return {
      path:   stack.map((s) => s.key),
      isLeaf: inlineValue !== undefined && inlineValue !== '',
    };
  });
}

/** The 0-based lines with a value that isn't in the defaults or differs from them. */
export function changedLineNumbers(defaults: object, mergedYaml: string): number[] {
  let merged: unknown;

  try {
    merged = jsyaml.load(mergedYaml || '');
  } catch (e) {
    return [];
  }

  if (!isPlainObject(merged)) {
    return [];
  }

  const lines: number[] = [];

  lineKeyPaths(mergedYaml).forEach((info, line) => {
    if (!info || !info.isLeaf) {
      return;
    }

    const mergedVal = get(merged, info.path);

    // A path through an array isn't found
    if (mergedVal === undefined || isObject(mergedVal)) {
      return;
    }

    const defaultVal = get(defaults || {}, info.path);

    if (defaultVal === undefined || !isEqual(mergedVal, defaultVal)) {
      lines.push(line);
    }
  });

  return lines;
}

// Compares the parsed YAML, as typing then deleting can leave whitespace behind
export function sameYamlOverrides(a: string, b: string): boolean {
  const parse = (yaml: string) => {
    try {
      return jsyaml.load(yaml || '') || {};
    } catch (e) {
      return undefined;
    }
  };
  const parsedA = parse(a);
  const parsedB = parse(b);

  if (parsedA === undefined || parsedB === undefined) {
    return a === b;
  }

  return isEqual(parsedA, parsedB);
}
