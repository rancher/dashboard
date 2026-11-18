import fs from 'fs';
import path from 'path';
import postcssScss from 'postcss-scss';
import colorLiterals from '../../eslint-plugin-local-rules/color-literals';

/**
 * Where shell and @rancher/components use each color primitive today, from the colors the lint baseline lists:
 * how many times, in which files, and which themes the stylesheet uses paint. A color written out counts toward
 * the primitive with its value, and a computed one toward the primitives the Color Primitives page records it
 * computing. Uses in theme variable definitions and Sass variable assignments are counted but leave the themes
 * alone: the page resolves the theme variables in each theme itself.
 */
export type ColorUsage = Record<string, { uses: number, files: Record<string, number>, light: boolean, dark: boolean }>;

const SOURCES = ['shell', 'pkg/rancher-components/src'];
const SKIP = /(^|\/)(node_modules|dist|__tests__|__mocks__)(\/|$)|\.(test|spec)\.[jt]s$|\/design-system\//;
const EXTENSIONS = /\.(vue|scss|css|ts|js|mjs)$/;
const THEME_FILES = /^shell\/assets\/styles\/(themes\/|base\/_variables-classic\.scss$|base\/_color-classic\.scss$)/;
const BASELINE_FILE = 'scripts/color-lint-baseline.txt';
const COMPUTED_FILE = 'storybook/src/stories/foundation/color-primitives-computed.json';
const ENTRY = /^(.+?):(\d+): (.*)$/;

type Theme = 'light' | 'dark' | 'both';
type Reference = { name: string, theme: Theme | null, key: string };
type Declaration = { start: number, end: number, property: string, value: string, headers: string[] };

const squash = (text: string) => text.replace(/\s+/g, ' ').trim();
const read = (root: string, file: string) => fs.readFileSync(path.join(root, file), 'utf8');

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

function declarations(source: string, file: string): Declaration[] {
  const sheets = file.endsWith('.vue') ? [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => ({
    css: m[1], offset: source.slice(0, (m.index as number) + m[0].indexOf(m[1])).split('\n').length - 1
  })) : [{ css: source, offset: 0 }];
  const found: Declaration[] = [];

  for (const { css, offset } of sheets) {
    postcssScss.parse(css).walk((node) => {
      const [property, value] = node.type === 'decl' ? [node.prop, node.raws.value?.raw ?? node.value] : node.type === 'atrule' ? [`@${ node.name }`, node.params] : [];

      if (property === undefined || value === undefined || !node.source?.start || !node.source.end) {
        return;
      }
      const headers: string[] = [];

      for (let parent = node.parent as any; parent?.type === 'rule' || parent?.type === 'atrule'; parent = parent.parent) {
        headers.unshift(parent.type === 'rule' ? parent.selector : `@${ parent.name } ${ parent.params }`);
      }
      found.push({
        start: node.source.start.line + offset, end: node.source.end.line + offset, property, value: squash(value), headers
      });
    });
  }

  return found;
}

function withOverrides(found: Reference[]): Reference[] {
  return found.map((ref) => {
    if (ref.theme !== 'both' || !ref.key) {
      return ref;
    }
    const overridden = (theme: Theme) => found.some((other) => other.theme === theme && other.key === ref.key);
    const darkOverride = overridden('dark');
    const lightOverride = overridden('light');

    return { ...ref, theme: darkOverride && !lightOverride ? 'light' : lightOverride && !darkOverride ? 'dark' : 'both' };
  });
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
 * Counts where shell and @rancher/components use each color primitive, from the colors in the lint baseline.
 *
 * @param root the repository root
 * @returns the usage of each primitive used, keyed by its custom property name
 */
export function colorUsage(root: string): ColorUsage {
  const primitives: Map<string, string> = colorLiterals.primitivesByKey(read(root, colorLiterals.PRIMITIVES_FILE));
  const computed = new Map<string, Set<string>>();

  for (const [name, entries] of Object.entries(JSON.parse(read(root, COMPUTED_FILE)).primitives as Record<string, { file: string, expression: string }[]>)) {
    for (const { file, expression } of entries) {
      const key = `${ file }\0${ squash(expression) }`;

      computed.set(key, (computed.get(key) || new Set()).add(name));
    }
  }
  const primitivesOf = (file: string, color: string): string[] => {
    const key = colorLiterals.colorKey(color);

    return key ? [primitives.get(key)].filter((name): name is string => !!name) : [...computed.get(`${ file }\0${ squash(color) }`) || []];
  };

  const byFile = new Map<string, { line: number, color: string }[]>();

  for (const line of read(root, BASELINE_FILE).split('\n')) {
    const [, file, number, color] = line.match(ENTRY) || [];

    if (file && !SKIP.test(file)) {
      byFile.set(file, [...byFile.get(file) || [], { line: Number(number), color }]);
    }
  }

  const usage: ColorUsage = {};

  for (const [file, colors] of byFile) {
    const sheet = /\.(vue|scss|css)$/.test(file) && fs.existsSync(path.join(root, file)) ? declarations(read(root, file), file) : [];
    const refs: Reference[] = colors.flatMap(({ line, color }) => {
      const declaration = sheet
        .filter((d) => d.start <= line && line <= d.end && d.value.includes(squash(color)))
        .sort((a, b) => (a.end - a.start) - (b.end - b.start))[0];
      const theme: Theme | null = !declaration ? 'both' : declaration.property.startsWith('$') || (THEME_FILES.test(file) && declaration.property.startsWith('--')) ? null : themeOf(declaration.headers);

      return primitivesOf(file, color).map((name) => ({
        name, theme, key: declaration ? unthemed(declaration.headers, declaration.property) : ''
      }));
    });

    for (const ref of withOverrides(refs)) {
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
