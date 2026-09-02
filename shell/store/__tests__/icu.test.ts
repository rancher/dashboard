import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import IntlMessageFormat from 'intl-messageformat';

// Guards the whole catalog against messages that IntlMessageFormat cannot handle. `t()` has no
// try/catch around the formatter, so a single malformed message takes down every component that
// renders it. These only surface at runtime for the one page that uses the key, which makes them
// expensive to catch any other way.
//
// `ignoreTag` mirrors `shell/store/i18n.ts` — the catalogs carry raw HTML that consumers render
// with `v-html`, not ICU tag markup.
const FORMAT_OPTS = { ignoreTag: true } as const;

const REPO_ROOT = path.resolve(__dirname, '../../..');
const TRANSLATIONS_DIR = path.join(REPO_ROOT, 'shell', 'assets', 'translations');
const PKG_DIR = path.join(REPO_ROOT, 'pkg');

function catalogFiles(): string[] {
  const files = fs.readdirSync(TRANSLATIONS_DIR)
    .filter((f) => f.endsWith('.yaml'))
    .map((f) => path.join(TRANSLATIONS_DIR, f));

  for (const pkg of fs.readdirSync(PKG_DIR)) {
    const l10n = path.join(PKG_DIR, pkg, 'l10n');

    if (!fs.existsSync(l10n)) {
      continue;
    }

    files.push(...fs.readdirSync(l10n).filter((f) => f.endsWith('.yaml')).map((f) => path.join(l10n, f)));
  }

  return files;
}

/**
 * Flatten a parsed catalog to the `dotted.key` / message pairs that `t()` would feed to the
 * formatter, i.e. only the strings containing an ICU argument.
 */
function icuMessages(doc: unknown): [string, string][] {
  const out: [string, string][] = [];

  const walk = (node: unknown, keyPath: string) => {
    if (node && typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) {
        walk(v, keyPath ? `${ keyPath }.${ k }` : k);
      }

      return;
    }

    if (typeof node === 'string' && node.includes('{')) {
      out.push([keyPath, node]);
    }
  };

  walk(doc, '');

  return out;
}

describe('translation catalogs', () => {
  const files = catalogFiles();

  it('finds catalogs to check', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  describe.each(files.map((f) => [path.relative(REPO_ROOT, f), f]))('%s', (_relative, file) => {
    const locale = path.basename(file, '.yaml');
    // FAILSAFE_SCHEMA keeps every scalar a string, so keys like `yes`/`on` are not coerced away
    const messages = icuMessages(yaml.load(fs.readFileSync(file, 'utf8'), { schema: yaml.FAILSAFE_SCHEMA }));

    it('contains at least one ICU message', () => {
      expect(messages.length).toBeGreaterThan(0);
    });

    it('parses and formats every ICU message', () => {
      const failures: string[] = [];

      for (const [key, message] of messages) {
        // Every `{name` in the message stands in for an argument the caller would supply
        const args = Object.fromEntries([...message.matchAll(/\{\s*([a-zA-Z0-9_]+)/g)].map((m) => [m[1], 1]));

        try {
          new IntlMessageFormat(message, locale, undefined, FORMAT_OPTS).format(args);
        } catch (e) {
          failures.push(`${ key }: ${ (e as Error).message.split('\n')[0] }`);
        }
      }

      expect(failures).toStrictEqual([]);
    });
  });
});
