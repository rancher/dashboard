/**
 * Stylelint config — correctness-only.
 *
 * The codebase has no stylistic style linting (ESLint + eslint-plugin-vue only
 * covers `<template>`/`<script>`, not `<style>` blocks). This config deliberately
 * enables ONLY rules that catch genuine bugs — invalid property values, unknown
 * properties/units, malformed grid — and leaves every cosmetic rule off.
 *
 * `declaration-property-value-no-unknown` validates values against the real CSS
 * grammar (via CSSTree), which does not understand SCSS variables/functions or
 * Vue's `v-bind()`. Those are ignored below so the rule reports only genuine
 * unknown values (e.g. `white-space: no-wrap`, `transform: ease-in-out-all 1s`)
 * and stays green enough to gate CI.
 */

// Value fragments that mean "this is SCSS/Vue syntax the CSS grammar can't parse".
const SCSS_VALUE_ESCAPES = [
  '/\\$/', //                                    SCSS variables:            $foo
  '/#\\{/', //                                   SCSS interpolation:        #{ ... }
  '/v-bind\\(/', //                              Vue SFC binding:           v-bind(x)
  '/z-index\\(/', //                             custom SCSS z-index() map function
  '/(darken|lighten)\\(/', //                     SCSS colour functions CSSTree can't parse
  '/[0-9)]\\s*\\*|\\*\\s*[0-9(]/', //            SCSS multiplication:       2 * $x
];

export default {
  overrides: [
    {
      files:        ['**/*.scss'],
      customSyntax: 'postcss-scss',
    },
    {
      files:        ['**/*.vue', '**/*.html'],
      customSyntax: 'postcss-html',
    },
  ],
  rules: {
    'declaration-property-value-no-unknown': [true, { ignoreProperties: { '/.+/': SCSS_VALUE_ESCAPES } }],
    'property-no-unknown':                   true,
    'unit-no-unknown':                       true,
    'named-grid-areas-no-invalid':           true,
    'no-duplicate-at-import-rules':          true,
    'block-no-empty':                        true,
    // `no-invalid-position-at-import-rule` is intentionally omitted: SCSS allows
    // `@import` after other statements, so it only produces false positives here.
  },
  ignoreFiles: [
    '**/node_modules/**',
    '**/dist/**',
    '**/dist-pkg/**',
    '**/coverage/**',
    '**/.nuxt/**',
  ],
};
