import fs from 'fs';
import path from 'path';
import Color from 'color';
import { compileString, Logger } from 'sass';
import { COLOR_TOKENS } from '@components/design-system/colors';

type Computation = { name: string, expression: string, inputs: Record<string, string> };

const TOKENS: Record<string, string> = COLOR_TOKENS;
const FUNCTIONS = path.resolve(__dirname, '../../../../../shell/assets/styles/base');
const CONTRASTED_DARK = '--color-gray-806';
const CONTRASTED_LIGHT = '--color-white';

const { primitives } = JSON.parse(fs.readFileSync(path.join(__dirname, '../color-primitives-computed.json'), 'utf8'));
const computations: Computation[] = Object.entries(primitives as Record<string, Omit<Computation, 'name'>[]>)
  .flatMap(([name, list]) => list.map((entry) => ({ ...entry, name })));

const rgba = (color: string) => {
  const parsed = Color(color);

  return [...parsed.rgb().array().slice(0, 3).map(Math.round), Math.round(parsed.alpha() * 100) / 100].join(', ');
};

function inBrowser({ expression, inputs }: Computation): string | undefined {
  const input = (...names: (string | undefined)[]) => Color(TOKENS[inputs[names.find((n) => n && inputs[n]) as string]]);
  let match = expression.match(/^color-mix\(in srgb, var\((--[\w-]+)(?:, var\((--[\w-]+)\))?\) ([\d.]+)%, transparent\)$/);

  if (match) {
    const color = input(match[1], match[2]);

    return color.alpha(color.alpha() * Number(match[3]) / 100).string();
  }

  match = expression.match(/^rgba\(var\((--[\w-]+)\), ([\d.]+)\)$/);

  if (match) {
    return input(match[1]).alpha(Number(match[2])).string();
  }

  match = expression.match(/^hsl\(from var\((--[\w-]+)\) h s calc\(l ([+-]) ([\d.]+)\)\)$/);

  if (match) {
    const color = input(match[1]).hsl();

    return color.lightness(color.lightness() + Number(`${ match[2] }${ match[3] }`)).string();
  }

  return undefined;
}

function inSass(list: Computation[]): (string | undefined)[] {
  const rules = list.map(({ expression, inputs }, i) => {
    const variables = Object.entries(inputs).filter(([input]) => input.startsWith('$')).map(([input, name]) => `${ input }: ${ TOKENS[name] };`);
    const bound = Object.entries(inputs).filter(([input]) => !input.startsWith('$')).reduce((e, [input, name]) => e.split(input).join(TOKENS[name]), expression);

    return `.c${ i } { ${ variables.join(' ') } value: ${ bound }; }`;
  });
  const { css } = compileString(
    `$contrasted-dark: ${ TOKENS[CONTRASTED_DARK] }; $contrasted-light: ${ TOKENS[CONTRASTED_LIGHT] };\n@import "functions";\n${ rules.join('\n') }`,
    { loadPaths: [FUNCTIONS], logger: Logger.silent }
  );
  const values = new Map([...css.matchAll(/\.c(\d+) \{\s*value: ([^;]+);/g)].map((m) => [Number(m[1]), m[2]]));

  return list.map((_, i) => values.get(i));
}

describe('the Color Primitives page', () => {
  it('names only primitives that exist in its computed colors', () => {
    const names = computations.flatMap(({ name, inputs }) => [name, ...Object.values(inputs)]);

    expect([...new Set(names.filter((name) => !TOKENS[name]))]).toStrictEqual([]);
  });

  it('still gets each computed color from its inputs', () => {
    const known = computations.filter(({ name, inputs }) => [name, ...Object.values(inputs)].every((n) => TOKENS[n]));
    const sass = known.filter(({ expression }) => !expression.includes('var('));
    const sassResults = inSass(sass);
    const stale = known.flatMap((computation) => {
      const result = computation.expression.includes('var(') ? inBrowser(computation) : sassResults[sass.indexOf(computation)];

      return result && rgba(result) === rgba(TOKENS[computation.name]) ? [] : [`${ computation.name }: ${ computation.expression } ${ JSON.stringify(computation.inputs) } gives ${ result ?? 'nothing this test can evaluate' }, not ${ TOKENS[computation.name] }`];
    });

    expect(stale).toStrictEqual([]);
  });

  it('styles itself with primitives that exist', () => {
    const page = fs.readFileSync(path.join(__dirname, '../ColorPrimitives.mdx'), 'utf8');
    const names = [...page.matchAll(/var\((--color-[\w-]+)\)/g)].map((m) => m[1]);

    expect(names.filter((name) => !TOKENS[name])).toStrictEqual([]);
  });
});
