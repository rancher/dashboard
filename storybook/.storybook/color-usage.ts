import fs from 'fs';
import path from 'path';
import postcssScss from 'postcss-scss';

/**
 * Where a design system color primitive is referenced: how many times, in which files, and which themes the
 * stylesheet references paint. References in theme variable definitions and Sass variable assignments are
 * counted but leave the themes alone: the Color Primitives page resolves the theme variables in each theme itself.
 */
export type ColorUsage = Record<string, { uses: number, files: Record<string, number>, light: boolean, dark: boolean }>;

const SOURCES = ['shell', 'pkg/rancher-components/src'];
const SKIP = /(^|\/)(node_modules|dist|__tests__|__mocks__)(\/|$)|\.(test|spec)\.[jt]s$|\/design-system\//;
const EXTENSIONS = /\.(vue|scss|css|ts|js|mjs)$/;
const THEME_FILES = /^shell\/assets\/styles\/(themes\/|base\/_variables-classic\.scss$|base\/_color-classic\.scss$)/;
const REFERENCE = /(?:--|\$)(color-(?:white|black|[a-z]+-\d+)(?:-a\d+)?)(?![\w-])/g;

type Theme = 'light' | 'dark' | 'both';
type Reference = { name: string, theme: Theme | null, key: string };

const blank = (text: string) => text.replace(/[^\n]/g, ' ');

function themeOf(headers: string[]): Theme {
  const scoped = headers.filter((h) => !/\bbody\b/i.test(h));
  const dark = scoped.some((h) => h.includes('theme-dark'));
  const light = scoped.some((h) => h.includes('theme-light'));

  return dark === light ? 'both' : dark ? 'dark' : 'light';
}

const unthemed = (headers: string[], property: string) => `${ headers.join(' ')
  .replace(/:is\(\.theme-(dark|light) \*\)|\.theme-(dark|light)|&/g, '')
  .replace(/\s+/g, ' ')
  .trim() } | ${ property }`;

function scanStylesheet(source: string, themeVariables: boolean): Reference[] {
  const found: Reference[] = [];

  postcssScss.parse(source).walk((node) => {
    const [property, value] = node.type === 'decl' ? [node.prop, node.value] : node.type === 'atrule' ? [`@${ node.name }`, node.params] : [];
    const headers: string[] = [];

    for (let parent = node.parent as any; parent?.type === 'rule' || parent?.type === 'atrule'; parent = parent.parent) {
      headers.unshift(parent.type === 'rule' ? parent.selector : `@${ parent.name } ${ parent.params }`);
    }
    for (const match of value?.matchAll(REFERENCE) || []) {
      found.push({
        name:  `--${ match[1] }`,
        theme: property.startsWith('$') || (themeVariables && property.startsWith('--')) ? null : themeOf(headers),
        key:   unthemed(headers, property),
      });
    }
  });

  return found.map((ref) => {
    if (ref.theme !== 'both') {
      return ref;
    }
    const overridden = (theme: Theme) => found.some((other) => other.theme === theme && other.key === ref.key);
    const darkOverride = overridden('dark');
    const lightOverride = overridden('light');

    return { ...ref, theme: darkOverride && !lightOverride ? 'light' : lightOverride && !darkOverride ? 'dark' : 'both' };
  });
}

function scanScript(source: string): Reference[] {
  return [...source.matchAll(REFERENCE)].map((m) => ({
    name: `--${ m[1] }`, theme: 'both', key: ''
  }));
}

function filesIn(root: string, dir: string): string[] {
  const full = path.join(root, dir);

  if (!fs.existsSync(full)) {
    return [];
  }

  return fs.readdirSync(full, { recursive: true, encoding: 'utf8' })
    .map((f) => `${ dir }/${ f.split(path.sep).join('/') }`)
    .filter((f) => EXTENSIONS.test(f) && !SKIP.test(f));
}

/**
 * Scans shell and @rancher/components for references to the color primitives.
 *
 * @param root the repository root
 * @returns the usage of each referenced primitive, keyed by its custom property name
 */
export function colorUsage(root: string): ColorUsage {
  const usage: ColorUsage = {};

  for (const file of SOURCES.flatMap((dir) => filesIn(root, dir))) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    let refs: Reference[];

    if (file.endsWith('.vue')) {
      const styles = [...source.matchAll(/(<style[^>]*>)([\s\S]*?)<\/style>/g)];
      let rest = source;

      for (const s of styles) {
        rest = rest.replace(s[2], blank(s[2]));
      }
      refs = [...styles.flatMap((s) => scanStylesheet(s[2], false)), ...scanScript(rest)];
    } else if (/\.(scss|css)$/.test(file)) {
      refs = scanStylesheet(source, THEME_FILES.test(file));
    } else {
      refs = scanScript(source);
    }

    for (const ref of refs) {
      const entry = usage[ref.name] ||= {
        uses: 0, files: {}, light: false, dark: false
      };

      entry.uses++;
      entry.files[file] = (entry.files[file] || 0) + 1;
      entry.light ||= ref.theme === 'light' || ref.theme === 'both';
      entry.dark ||= ref.theme === 'dark' || ref.theme === 'both';
    }
  }

  return usage;
}

const VARIABLE = /--(?!color-)[a-z][\w-]*[a-z0-9](?![\w-])/gi;
const DEFINITION = /^\s*['"`]?(--[\w-]+)['"`]?\s*:(.*)$/;
const PREFIX = /(?:['"`]|var\()(--[a-z][\w-]*-)(?:['"`]\s*\+|\$\{)/gi;

/**
 * Finds the custom properties that stylesheets in shell and @rancher/components define but nothing paints:
 * no style, template or script reads them, and no painted custom property is defined from them.
 *
 * @param root the repository root
 * @returns the unpainted custom property names, sorted
 */
export function unpaintedVariables(root: string): string[] {
  const defined = new Set<string>();
  const painted = new Set<string>();
  const feeds = new Map<string, string[]>();
  const prefixes: string[] = [];

  for (const file of SOURCES.flatMap((dir) => filesIn(root, dir))) {
    const stylesheet = /\.(scss|css|vue)$/.test(file);

    for (const line of fs.readFileSync(path.join(root, file), 'utf8').split('\n')) {
      const definition = line.match(DEFINITION);

      if (definition) {
        if (stylesheet) {
          defined.add(definition[1]);
        }
        feeds.set(definition[1], [...feeds.get(definition[1]) || [], ...definition[2].match(VARIABLE) || []]);
        continue;
      }
      (line.match(VARIABLE) || []).forEach((name) => painted.add(name));
      prefixes.push(...[...line.matchAll(PREFIX)].map((m) => m[1]));
    }
  }

  for (let grew = true; grew;) {
    grew = false;
    for (const [name, sources] of feeds) {
      for (const source of painted.has(name) ? sources : []) {
        grew = !painted.has(source) || grew;
        painted.add(source);
      }
    }
  }

  return [...defined].filter((name) => !painted.has(name) && !prefixes.some((p) => name.startsWith(p))).sort();
}
