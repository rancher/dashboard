import fs from 'fs';
import path from 'path';
import { COLOR_TOKENS } from './colors';

const read = (file: string) => fs.readFileSync(path.join(__dirname, file), 'utf8');

const variables = Object.fromEntries(
  [...read('_color-variables.scss').matchAll(/^\$(color-[\w-]+):\s*([^;]+);/gm)].map(([, name, value]) => [`--${ name }`, value.trim()])
);
const properties = [...read('colors.scss').matchAll(/^\s*(--color-[\w-]+):\s*#\{\$(color-[\w-]+)\};/gm)].map(([, property, variable]) => [property, `--${ variable }`]);

describe('design system colors', () => {
  it('defines at least one primitive', () => {
    expect(Object.keys(variables).length).toBeGreaterThan(0);
  });

  it('exposes every Sass variable as a custom property', () => {
    expect(properties.map(([property]) => property)).toStrictEqual(Object.keys(variables));
  });

  it('gives each custom property the Sass variable of the same name', () => {
    expect(properties.filter(([property, variable]) => property !== variable)).toStrictEqual([]);
  });

  it('gives colors.ts the same values as the Sass variables', () => {
    expect({ ...COLOR_TOKENS }).toStrictEqual(variables);
  });
});
