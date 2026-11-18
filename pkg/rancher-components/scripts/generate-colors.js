/**
 * Writes design-system/colors.ts from the color primitives colors.scss emits. Run `yarn generate:colors` after
 * changing _color-variables.scss.
 */
const fs = require('fs');
const path = require('path');
const { compile } = require('sass');

const DESIGN_SYSTEM = path.join(__dirname, '..', 'src', 'components', 'design-system');
const OUTPUT = path.join(DESIGN_SYSTEM, 'colors.ts');

const HEADER = `/**
 * Generated from colors.scss by \`yarn generate:colors\`, so don't edit it. Each primitive's value, for code that needs
 * the color itself rather than \`var(--color-*)\`.
 */
`;

/**
 * @returns {string} the contents colors.ts should have
 */
function generateColors() {
  const css = compile(path.join(DESIGN_SYSTEM, 'colors.scss')).css;
  const tokens = [...css.matchAll(/^\s*(--color-[\w-]+):\s*([^;]+);/gm)].map(([, name, value]) => [`'${ name }':`, `'${ value.trim() }',`]);
  const width = Math.max(...tokens.map(([key]) => key.length));

  return `${ HEADER }export const COLOR_TOKENS = {\n${ tokens.map(([key, value]) => `  ${ key.padEnd(width) } ${ value }`).join('\n') }\n} as const;\n`;
}

if (require.main === module) {
  fs.writeFileSync(OUTPUT, generateColors());
}

module.exports = { OUTPUT, generateColors };
