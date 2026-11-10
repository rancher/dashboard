import fs from 'fs';
import path from 'path';
import { compile } from 'sass';
import { generateColors, OUTPUT } from '../../../scripts/generate-colors';

const read = (file: string) => fs.readFileSync(path.join(__dirname, file), 'utf8');

const variables = Object.fromEntries(
  [...read('_color-variables.scss').matchAll(/^\$(color-[\w-]+):\s*([^;]+);/gm)].map(([, name, value]) => [`--${ name }`, value.trim()])
);
const properties = Object.fromEntries(
  [...compile(path.join(__dirname, 'colors.scss')).css.matchAll(/^\s*(--color-[\w-]+):\s*([^;]+);/gm)].map(([, property, value]) => [property, value.trim()])
);

describe('design system colors', () => {
  it('defines at least one primitive', () => {
    expect(Object.keys(variables).length).toBeGreaterThan(0);
  });

  it('exposes every Sass variable as the custom property of the same name and value', () => {
    expect(properties).toStrictEqual(variables);
  });

  it('has the colors.ts that `yarn generate:colors` writes', () => {
    expect(fs.readFileSync(OUTPUT, 'utf8')).toStrictEqual(generateColors());
  });
});
